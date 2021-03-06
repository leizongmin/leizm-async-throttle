import { expect } from "chai";
import { AsyncThrottle, AsyncThrottleRunTimeoutError, AsyncThrottleWaitTimeoutError } from "./throttle";

function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

describe("AsyncThrottle", function() {
  it("基本使用", async function() {
    const t = new AsyncThrottle({ concurrent: 10, timeout: 1000 });
    expect(
      await t.run(async () => {
        expect(t.stat()).to.deep.equal({ running: 1, waitting: 0, tps: 1 });
        await sleep(0);
        return 12345;
      }),
    ).to.equal(12345);
    expect(
      await t.run(async () => {
        expect(t.stat()).to.deep.equal({ running: 1, waitting: 0, tps: 2 });
        await sleep(0);
        return 456789;
      }),
    ).to.equal(456789);
  });

  it("等待顺序执行", async function() {
    this.timeout(100000);
    const t = new AsyncThrottle({ concurrent: 10, timeout: 200 });
    const list: any[] = [];
    for (let i = 0; i < 10; i++) {
      list.push(
        t.run(async () => {
          await sleep(150);
          return i + 10;
        }),
      );
    }
    const list2: any[] = [];
    for (let i = 10; i < 20; i++) {
      list2.push(
        t.run(async () => {
          await sleep(150);
          return i + 10;
        }),
      );
    }
    expect(await Promise.all(list)).to.deep.equal([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
    expect(await Promise.all(list2)).to.deep.equal([20, 21, 22, 23, 24, 25, 26, 27, 28, 29]);
  });

  it("执行超时", async function() {
    const t = new AsyncThrottle({ concurrent: 1, timeout: 100 });
    let isThrowError = false;
    try {
      await t.run(async () => {
        await sleep(150);
        return 12345;
      });
    } catch (err) {
      isThrowError = true;
      expect(err).to.instanceOf(AsyncThrottleRunTimeoutError);
    }
    expect(isThrowError).to.equal(true);
    expect(
      await t.run(async () => {
        await sleep(20);
        return 456789;
      }),
    ).to.equal(456789);
  });

  it("等待超时", async function() {
    this.timeout(100000);
    const t = new AsyncThrottle({ concurrent: 1, timeout: 200 });
    const list: any[] = [];
    let counter = 0;
    for (let i = 0; i < 10; i++) {
      list.push(
        t.run(async () => {
          await sleep(150);
          counter++;
          return i + 10;
        }),
      );
    }
    let isThrowError = false;
    try {
      await Promise.all(list);
    } catch (err) {
      isThrowError = true;
      expect(err).to.instanceOf(AsyncThrottleWaitTimeoutError);
    }
    expect(isThrowError).to.equal(true);
    expect(counter).to.deep.equal(1);
  });

  it("限制TPS", async function() {
    this.timeout(100000);

    // 保证开始时间是接近整秒的
    const timestamp = Math.floor(Date.now() / 1000) * 1000;
    await sleep(timestamp + 1000 - Date.now());

    const startTime = Date.now();
    const t = new AsyncThrottle({ timeout: 100000, tps: 10 });
    const list: any[] = [];
    let counter = 0;
    for (let i = 0; i < 30; i++) {
      list.push(
        t.run(async () => {
          await sleep(0);
          counter++;
          return i + 10;
        }),
      );
    }
    let isThrowError = false;
    try {
      await Promise.all(list);
    } catch (err) {
      isThrowError = true;
      expect(err).to.instanceOf(AsyncThrottleWaitTimeoutError);
    }
    expect(isThrowError).to.equal(false);
    expect(counter).to.deep.equal(30);
    expect(Date.now() - startTime).to.above(2000);
  });

  it("限制TPS和并发", async function() {
    this.timeout(100000);

    // 保证开始时间是接近整秒的
    const timestamp = Math.floor(Date.now() / 1000) * 1000;
    await sleep(timestamp + 1000 - Date.now());

    const startTime = Date.now();
    const t = new AsyncThrottle({ timeout: 100000, tps: 10, concurrent: 2 });
    const list: any[] = [];
    let counter = 0;
    for (let i = 0; i < 30; i++) {
      list.push(
        t.run(async () => {
          await sleep(0);
          counter++;
          return i + 10;
        }),
      );
    }
    let isThrowError = false;
    try {
      await Promise.all(list);
    } catch (err) {
      isThrowError = true;
      expect(err).to.instanceOf(AsyncThrottleWaitTimeoutError);
    }
    expect(isThrowError).to.equal(false);
    expect(counter).to.deep.equal(30);
    expect(Date.now() - startTime).to.above(2000);
  });
});
