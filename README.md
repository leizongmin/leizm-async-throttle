# @leizm/async-throttle
异步操作限流

## 安装

```bash
npm install @leizm/async-throttle --save
```

## 使用

```typescript
const t = new AsyncThrottle({ capacity: 10, timeout: 1000 });

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
┌─────────────────────┬──────────┬─────────┬────────┐
│ test                │ rps      │ ns/op   │ spent  │
├─────────────────────┼──────────┼─────────┼────────┤
│ #run capacity=100   │ 57396.8  │ 17422.6 │ 2.218s │
├─────────────────────┼──────────┼─────────┼────────┤
│ #run capacity=1000  │ 131018.5 │ 7632.5  │ 2.160s │
├─────────────────────┼──────────┼─────────┼────────┤
│ #run capacity=10000 │ 137174.2 │ 7290.0  │ 2.187s │
└─────────────────────┴──────────┴─────────┴────────┘
```

说明：当 `capacity` 不受限制时，执行 `setTimeout(fn, 0)` 异步任务可以达到 137174 次每秒，即性能损害基本可忽略不计。

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
