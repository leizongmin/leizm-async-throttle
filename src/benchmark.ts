import Benchmark from "@leizm/benchmark";
import AsyncThrottle from "./throttle";

const b = new Benchmark({ title: "@leizm/async-throttle Benchmark", concurrent: 10000 });

const t1 = new AsyncThrottle({ timeout: 10000, capacity: 100 });
const t2 = new AsyncThrottle({ timeout: 10000, capacity: 1000 });
const t3 = new AsyncThrottle({ timeout: 10000, capacity: 10000 });

b.addAsync("#run capacity=100", async () => {
  await t1.run(async () => makeAsync(123456));
})
  .addAsync("#run capacity=1000", async () => {
    await t2.run(async () => makeAsync(123456));
  })
  .addAsync("#run capacity=10000", async () => {
    await t3.run(async () => makeAsync(123456));
  })
  .run()
  .then(r => b.print(r))
  .catch(console.log);

function makeAsync(ret: any) {
  return new Promise(resolve => setTimeout(() => resolve(ret), 0));
}
