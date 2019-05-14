# @leizm/async-throttle
异步操作限流

## 安装

```bash
npm install @leizm/async-throttle --save
```

## 使用

```typescript
const t = new AsyncThrottle({
  concurrent: 10, // 并发
  tps: 1000,      // 每秒最多可处理的请求数
  timeout: 1000,  // 超时时间
});

const ret = await t.run(async () => {
  return 12345;
});
// 返回结果：12345
```

## 性能

```
------------------------------------------------------------------------
@leizm/async-throttle Benchmark
------------------------------------------------------------------------

Platform info:
- Darwin 18.5.0 x64
- Node.JS: 10.15.3
- V8: 6.8.275.32-node.51
  Intel(R) Core(TM) i7-6820HQ CPU @ 2.70GHz × 8


3 tests success:
┌───────────────────────┬──────────┬─────────┬────────┐
│ test                  │ rps      │ ns/op   │ spent  │
├───────────────────────┼──────────┼─────────┼────────┤
│ #run concurrent=100   │ 53252.1  │ 18778.6 │ 2.221s │
├───────────────────────┼──────────┼─────────┼────────┤
│ #run concurrent=1000  │ 143878.0 │ 6950.3  │ 2.099s │
├───────────────────────┼──────────┼─────────┼────────┤
│ #run concurrent=10000 │ 136674.3 │ 7316.7  │ 2.195s │
└───────────────────────┴──────────┴─────────┴────────┘
```

说明：当 `capacity` 不受限制时，执行 `setTimeout(fn, 0)` 异步任务可以达到 13 万次每秒，即性能损害基本可忽略不计。

## License

```
MIT License

Copyright (c) 2019 Zongmin Lei <leizongmin@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
