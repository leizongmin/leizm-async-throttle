/**
 * 执行超时错误
 */
export class AsyncThrottleRunTimeoutError extends Error {
  public name: string = "AsyncThrottleRunTimeoutError";
  public code: string = "RUN_TIMEOUT";
}

/**
 * 等待超时错误
 */
export class AsyncThrottleWaitTimeoutError extends Error {
  public name: string = "AsyncThrottleWaitTimeoutError";
  public code: string = "WAIT_TIMEOUT";
}

/**
 * 限流器选项
 */
export interface IAsyncThrottleOptions {
  /** 超时时间 */
  timeout: number;
  /** 同时执行任务容量，如果当前执行任务超过此限定值，则新任务放到等待队列 */
  capacity: number;
}

export interface IWaitItem {
  /** 任务票据 */
  ticket: string;
  /** 时间戳 */
  timestamp: number;
  /** 定时器ID */
  tid: NodeJS.Timeout;
  /** 执行成功 */
  resolve: (ret: any) => void;
  /** 执行失败 */
  reject: (err: Error) => void;
  /** 执行函数 */
  fn: () => Promise<any>;
}

export class AsyncThrottle {
  protected readonly timeout: number;
  protected readonly capacity: number;
  protected runningTask: Map<string, IWaitItem> = new Map();
  protected waittingList: IWaitItem[] = [];

  constructor(options: IAsyncThrottleOptions) {
    this.timeout = options.timeout;
    this.capacity = options.capacity;
  }

  protected generateTicket() {
    return Date.now().toString(32) + Math.random().toString(32);
  }

  /**
   * 等待并获得一个ticket
   */
  public run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const ticket = this.generateTicket();
      const timestamp = Date.now();
      if (this.runningTask.size < this.capacity) {
        const tid = setTimeout(() => {
          this.reject(ticket, new AsyncThrottleRunTimeoutError());
        }, this.timeout);
        this.runningTask.set(ticket, { ticket, timestamp, tid, resolve, reject, fn });
        fn()
          .then(ret => this.resolve(ticket, ret))
          .catch(err => this.reject(ticket, err));
      } else {
        const tid = setTimeout(() => {
          this.reject(ticket, new AsyncThrottleWaitTimeoutError());
        }, this.timeout);
        this.waittingList.push({ ticket, timestamp, tid, resolve, reject, fn });
      }
    });
  }

  /**
   * 执行成功
   * @param ticket
   * @param ret
   */
  protected resolve(ticket: string, ret: any) {
    const item = this.runningTask.get(ticket);
    this.runningTask.delete(ticket);
    if (item) {
      clearTimeout(item.tid);
      item.resolve(ret);
    }
    this.runNextTask();
  }

  /**
   * 执行失败
   * @param ticket
   * @param err
   */
  protected reject(ticket: string, err: Error) {
    if (err instanceof AsyncThrottleWaitTimeoutError) {
      const i = this.waittingList.findIndex(v => v.ticket === ticket);
      if (i !== -1) {
        const item = this.waittingList[i];
        this.waittingList.splice(i, 1);
        clearTimeout(item.tid);
        item.reject(err);
      }
    } else {
      const item = this.runningTask.get(ticket);
      this.runningTask.delete(ticket);
      if (item) {
        clearTimeout(item.tid);
        item.reject(err);
      }
    }
    this.runNextTask();
  }

  /**
   * 执行任务
   */
  protected runNextTask() {
    if (this.runningTask.size < this.capacity && this.waittingList.length > 0) {
      const item = this.waittingList.shift()!;
      clearTimeout(item.tid);
      item.tid = setTimeout(() => {
        this.reject(item.ticket, new AsyncThrottleRunTimeoutError());
      }, this.timeout);
      item.timestamp = Date.now();
      this.runningTask.set(item.ticket, item);
      item
        .fn()
        .then(ret => this.resolve(item.ticket, ret))
        .catch(err => this.reject(item.ticket, err));
    }
  }
}

export default AsyncThrottle;
