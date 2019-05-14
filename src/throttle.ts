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
  timeout?: number;
  /** 同时执行任务的数量，如果当前执行任务超过此限定值，则新任务放到等待队列 */
  concurrent?: number;
  /** 限制TPS（每秒可完成的数量） */
  tps?: number;
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

/**
 * 获得秒时间戳
 */
function getSecondTimestamp(): number {
  return parseInt((Date.now() / 1000) as any, 10);
}

class TPSCounter {
  protected timestamp: number = 0;
  protected counter: number = 0;

  /**
   * 加1
   */
  public incr(n: number = 1) {
    const t = getSecondTimestamp();
    if (t === this.timestamp) {
      this.counter += n;
    } else {
      this.timestamp = t;
      this.counter = n;
    }
  }

  /**
   * 加0
   */
  public noop() {
    this.incr(0);
    return this;
  }

  /**
   * 判断是否在范围内
   * @param n
   */
  public isWithinLimit(n: number): boolean {
    return this.counter <= n;
  }
}

export const DEFAULT_TIMEOUT = 3600000;
export const DEFAULT_CONCURRENT = 1000;
export const DEFAULT_TPS = Number.MAX_SAFE_INTEGER;

export class AsyncThrottle {
  protected readonly timeout: number;
  protected readonly concurrent: number;
  protected readonly tps: number;
  protected runningTask: Map<string, IWaitItem> = new Map();
  protected waittingList: IWaitItem[] = [];
  protected tpsCounter: TPSCounter = new TPSCounter();

  constructor(options: IAsyncThrottleOptions) {
    this.timeout = options.timeout! > 0 ? options.timeout! : DEFAULT_TIMEOUT;
    this.concurrent = options.concurrent! > 0 ? options.concurrent! : DEFAULT_CONCURRENT;
    this.tps = options.tps! > 0 ? options.tps! : DEFAULT_TPS;
  }

  /**
   * 生成一个随机的ticket
   */
  protected generateTicket() {
    return Date.now().toString(32) + Math.random().toString(32);
  }

  /**
   * 判断当前是否可以立即执行新任务
   */
  protected canRunNewTaskImmediate() {
    return this.runningTask.size < this.concurrent && this.tpsCounter.noop().isWithinLimit(this.tps);
  }

  /**
   * 等待并获得一个ticket
   */
  public run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const ticket = this.generateTicket();
      const timestamp = Date.now();
      if (this.canRunNewTaskImmediate()) {
        const tid = setTimeout(() => {
          this.reject(ticket, new AsyncThrottleRunTimeoutError());
        }, this.timeout);
        this.runningTask.set(ticket, { ticket, timestamp, tid, resolve, reject, fn });
        this.tpsCounter.incr();
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
    if (this.waittingList.length > 0) {
      if (this.canRunNewTaskImmediate()) {
        const item = this.waittingList.shift()!;
        clearTimeout(item.tid);
        item.tid = setTimeout(() => {
          this.reject(item.ticket, new AsyncThrottleRunTimeoutError());
        }, this.timeout);
        item.timestamp = Date.now();
        this.runningTask.set(item.ticket, item);
        this.tpsCounter.incr();
        item
          .fn()
          .then(ret => this.resolve(item.ticket, ret))
          .catch(err => this.reject(item.ticket, err));
      } else {
        // 下一秒开始时再尝试执行
        const wait = (getSecondTimestamp() + 1) * 1000 - Date.now();
        setTimeout(() => this.runNextTask(), wait);
      }
    }
  }
}

export default AsyncThrottle;
