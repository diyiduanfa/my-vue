const queue:any[] = [];
//用来只创建一次promise，不需要每次都创建promise、
let isFlushPending = false;
const p = Promise.resolve();


//其实就是把fn推到了微任务队列中
export function nextTick(fn) {
    return fn ?  p.then(fn) : p
}

export function queueJobs(job) {
    //队列不存在才进行添加
    if (!queue.includes(job)) {
        queue.push(job);
    }

    queueFlush();
}

function queueFlush() {
    if (isFlushPending) return
    isFlushPending = true;
    //创建一个微任务异步执行更新的逻辑
    nextTick(flushJobs)
}

function flushJobs() {
    //执行队列
    isFlushPending = false;
    let job;
    while(job = queue.shift()) {
        job && job();
    }
}