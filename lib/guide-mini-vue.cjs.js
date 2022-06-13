'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        component: null,
        shapeFlag: getShapeFlag(type),
        key: props && props.key,
        el: null
    };
    //children
    if (typeof children === "string") {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    //组件 + children(object) ->slot
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === "object") {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function h(vnode, props, children) {
    return createVNode(vnode, props, children);
}

function renderSlots(slots, name, props) {
    //返回vnode作为children
    const slot = slots[name];
    if (slot) {
        //function
        if (typeof slot === "function") {
            //只渲染children
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

function toDisplayString(value) {
    return String(value);
}

const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === "object";
};
const isString = (val) => {
    return typeof val === "string";
};
const hasChanged = (newv, val) => {
    return !Object.is(newv, val);
};
const hasOwn = (val, key) => {
    return Object.prototype.hasOwnProperty.call(val, key);
};
const EMPTY_OBJECT = {};

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        //判断某个对象上是否有某个值
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
        //后续还可以实现各种$
    }
};

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

let activeEffect, shouldTrack;
class ReactiveEffect {
    constructor(fn, schedular) {
        this.schedular = schedular;
        this.deps = [];
        this.active = true;
        this._fn = fn;
    }
    run() {
        //会收集依赖
        //shouldTrack来区分
        if (!this.active) {
            return this._fn();
        }
        shouldTrack = true;
        activeEffect = this;
        const result = this._fn();
        //reset
        shouldTrack = false;
        return result;
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = [];
}
const targetMap = new Map();
function track(target, key) {
    if (!isTracking())
        return;
    //target ->key -> dep
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    //已经在dep中
    trackEffects(dep);
}
function trackEffects(dep) {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
function isTracking() {
    //应该收集状态
    return shouldTrack && activeEffect !== undefined;
}
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.schedular) {
            effect.schedular();
        }
        else {
            effect.run();
        }
    }
}
function effect(fn, options) {
    //fn
    const _effect = new ReactiveEffect(fn, options.schedular);
    //options
    //extend
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadOnly = false, isShallow = false) {
    return function get(target, key) {
        const res = Reflect.get(target, key);
        if (key === "_v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadOnly;
        }
        else if (key === "_v_isReadOnly" /* ReactiveFlags.IS_ReadOnly */) {
            return isReadOnly;
        }
        if (isShallow) {
            return res;
        }
        if (isObject(res)) {
            return isReadOnly ? readonly(res) : reactive(res);
        }
        //todo依赖收集
        if (!isReadOnly) {
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        //todo触发依赖
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key:${key} set 失败，因为 ${target} 是readonly`);
        return true;
    }
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
});

function createReactiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`${target}必须是一个对象`);
        return;
    }
    return new Proxy(target, baseHandlers);
}
function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}

function emit(instance, event, ...args) {
    //找到props里面的event
    const { props } = instance;
    //处理首字母大写，拼出props里面的事件名（onAdd）
    //add - Add
    const capitalize = (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };
    //add-foo -> AddFoo
    const camelize = (str) => {
        return str.replace(/-(\w)/g, (_, c) => {
            return c ? c.toUpperCase() : "";
        });
    };
    const toHandleKey = (str) => {
        return str ? "on" + capitalize(str) : "";
    };
    const handlerName = toHandleKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

//1 true "1
//proxy对于对象，ref是值类型
//class {} -> get/set
class RefImpl {
    constructor(value) {
        this._v_isRef = true;
        this._rawValue = value;
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newvalue) {
        //一定是先修改了值
        if (hasChanged(newvalue, this._rawValue)) {
            this._rawValue = newvalue;
            this._value = convert(newvalue);
            triggerEffects(this.dep);
        }
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref._v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    //作用：setup的ref返回值在使用时不需要.value
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            //value值不是ref，target[key]是ref，修改.value值
            if (isRef(target[key]) && !isRef(value)) {
                return target[key].value = value;
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        next: null,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
        emit: () => { }
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    //todo
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    //处理有状态的组件
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    //ctx
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        //function(render) ,obj
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    //function object
    //todo function
    if (typeof setupResult === "object") {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    //用户不存在render
    if (compiler && !Component.render) {
        if (Component.template) {
            Component.render = compiler(Component.template);
        }
    }
    instance.render = Component.render;
}
//当前实例
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}
//提供一函数来拿到模板编译生成的render
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
}

function provide(key, value) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        //原型链继承
        const parentProvides = currentInstance.parent.provides;
        //init
        if (provides === parentProvides) {
            currentInstance.provides = Object.create(parentProvides);
            provides = currentInstance.provides;
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === "function") {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

// import { render } from "./renderer";
function createAppApi(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                //转换成虚拟节点
                //component ->vnode
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            }
        };
    };
}

function shouldUpdateComponent(prevVnode, nextVnode) {
    const { props: prevProps } = prevVnode;
    const { props: nextProps } = nextVnode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

const queue = [];
//用来只创建一次promise，不需要每次都创建promise、
let isFlushPending = false;
const p = Promise.resolve();
//其实就是把fn推到了微任务队列中
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function queueJobs(job) {
    //队列不存在才进行添加
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    //创建一个微任务异步执行更新的逻辑
    nextTick(flushJobs);
}
function flushJobs() {
    //执行队列
    isFlushPending = false;
    let job;
    while (job = queue.shift()) {
        job && job();
    }
}

//自定义渲染器
function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = options;
    function render(vnode, container) {
        patch(null, vnode, container, null, null);
    }
    //n1老的节点 n2新的
    function patch(n1, n2, container, parentComponent, anchor) {
        //需要判断是element 还是component或fragment
        //处理组件
        const { shapeFlag, type } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            //更新
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        const oldProps = n1.props;
        const newProps = n2.props;
        //需要把el赋值给新的节点
        const el = (n2.el = n1.el);
        patchProps(el, oldProps, newProps);
        //text -> array ,text -> text ,array ->text ,array ->array
        patchChildren(n1, n2, el, parentComponent, anchor);
        //props
        //children
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const prevShapeFlag = n1.shapeFlag;
        const c1 = n1.children;
        const shapeFlag = n2.shapeFlag;
        const c2 = n2.children;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            //array->text
            if (prevShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                //1.把老的children清空
                unmountChildren(n1.children);
                //2.设置text
                //    hostSetElementText(container,c2);
            }
            //text->text
            //     else {
            //         if (c1 !== c2) {
            //             hostSetElementText(container,c2);
            //         }
            //    }
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            //text->array
            if (prevShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                hostSetElementText(container, "");
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                //array ->array(diff)
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    //diff算法
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        let i = 0, l2 = c2.length, e1 = c1.length - 1, e2 = l2 - 1;
        //判断两个节点是否相同
        function isSameVNodeType(n1, n2) {
            //type,key
            return n1.type === n2.type && n1.key === n2.key;
        }
        //起始大于结束后终止循环
        //左侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        //右侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        //新的大于老的，需要进行创建
        if (i > e1) {
            if (i <= e2) {
                //anchor
                /*这里取e2的下一个，并判断是否大于新的长度，如果大于，说明是左侧相同，那么锚点为空，
                innsertBefore的第二个参数为空，就会直接加到后面，如果比新长度小，说明右侧相同，那么锚点就是e2指的后面的一个节点
                然后遍历i到e1的节点，依次插入锚点的前面
                */
                const nextPos = e2 + 1;
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        //老的的大于新的，需要进行删除
        else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            //乱序
            let s1 = i, s2 = i;
            //新的数组的中间乱序的长度
            const toBePatched = e2 - s2 + 1;
            //用来标志新节点的patch次数，和toBepatched比较，老节点还有多的没有patch，就直接删除
            let patched = 0;
            //建立映射表
            //新数组的key和index的映射表
            const keyToNewIndexMap = new Map();
            //新老数组的索引值映射表
            const newIndexToOldIndexMap = new Array(toBePatched);
            //是否需要移动（获取最长递增子序列）
            let moved = false;
            let maxNewIndexSoFar = 0;
            //初始化映射表,初始化为-1，表示节点还没有patch
            for (let i = 0; i < toBePatched; i++) {
                newIndexToOldIndexMap[i] = -1;
            }
            //初始化新数组key和index的映射关系
            for (let p = s2; p <= e2; p++) {
                const nextChild = c2[p];
                keyToNewIndexMap.set(nextChild.key, p);
            }
            for (let p = s1; p <= e1; p++) {
                const prevChild = c1[p];
                //如果新节点已经遍历完了，而老节点还有多的没有patch，就直接删除
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                //key存在通过map判断是否存在
                //key不存在需要遍历判断相不相等
                let newIndex;
                if (prevChild.key !== null) {
                    //根据key获取老节点在新节点里面的index
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    //不用key的话就需要再次遍历一边会使时间复杂度变为O（n2）
                    for (let j = s2; j <= e2; j++) {
                        if (isSameVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                //表示节点不存在
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    //新的index大于记录下来的点，表示不需要移动，否则需要移动
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    //减去s2表示索引从0开始
                    newIndexToOldIndexMap[newIndex - s2] = p;
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            //获取最长递增子序列[5,3,4] -> [1,2]//返回最长递增子序列的index    
            const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
            let j = increasingNewIndexSequence.length - 1; //作为最长递增子序列的尾指针
            //遍历原数组和最长递增子序列进行比较，判断存不存在，不在的话需要移动
            //由于需要innsertBefore，由于不确定后面的元素有没有被patch（是否稳定），
            //所以采用倒序的方式
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2, nextChild = c2[nextIndex];
                //锚点是当前元素的下一个
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                //-1表示需要新的节点在老的里面不存在，需要创建
                if (newIndexToOldIndexMap[i] === -1) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        //移动
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        //存在的话子序列的指针往后移，继续判断
                        j--;
                    }
                }
            }
        }
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            hostRemove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            //3种情况，1.foo：1 -》 foo：2
            //2.foo:1 -> foo:null | undefined
            //3.foo:1 ,bar:1 -> foo:1
            for (const key in newProps) {
                const prevProp = oldProps[key], nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
        }
        if (oldProps !== EMPTY_OBJECT) {
            for (const key in oldProps) {
                if (!(key in newProps)) {
                    hostPatchProp(el, key, oldProps[key], null);
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        const { children, props, shapeFlag } = vnode;
        //children的两种类型string和array
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        for (let key in props) {
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        //没有老节点，初始化组件,有老节点，更新组件
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    //更新组件
    function updateComponent(n1, n2) {
        //赋值到n2上，这样n2就是下次更新的n1
        const instance = (n2.component = n1.component);
        //判断是否需要更新才调用update
        if (shouldUpdateComponent(n1, n2)) {
            //更新就是重新调用该组件的render函数，重新生成虚拟节点，再进行patch对比
            //将新的虚拟节点放到实例上
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function mountComponent(initialVnode, container, parentComponent, anchor) {
        const instance = (initialVnode.component = createComponentInstance(initialVnode, parentComponent));
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container, anchor);
    }
    function setupRenderEffect(instance, initialVnode, container, anchor) {
        //依赖收集，当set的时候重新调用effect的回调，从而继续调用render，生成新的虚拟节点
        //这里给实例增加update是因为effect的返回值被调用之后会重新调用fn，从而就会重新生成组件的虚拟节点
        instance.update = effect(() => {
            if (!instance.isMounted) { //init
                //取数据的this代理
                const { proxy } = instance;
                //先把之前的虚拟节点存起来
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                //vnode -> patch
                patch(null, subTree, container, instance, anchor);
                initialVnode.el = subTree.el;
                instance.isMounted = true;
            }
            else { //update
                console.log("update");
                //next：要更新的虚拟节点，vnode：之前的虚拟节点
                const { proxy, next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const subTree = instance.render.call(proxy, proxy);
                const prevSubTree = instance.subTree;
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        }, {
            //这里控制视图的异步更新
            schedular: () => {
                console.log("update--scheduler");
                //将更新的操作收集起来进入微任务队列中
                queueJobs(instance.update);
            }
        });
    }
    //获取最长递增子序列，copy vue3源码
    function getSequence(arr) {
        const p = arr.slice();
        const result = [0];
        let i, j, u, v, c;
        const len = arr.length;
        for (i = 0; i < len; i++) {
            const arrI = arr[i];
            if (arrI !== 0) {
                j = result[result.length - 1];
                if (arr[j] < arrI) {
                    p[i] = j;
                    result.push(i);
                    continue;
                }
                u = 0;
                v = result.length - 1;
                while (u < v) {
                    c = (u + v) >> 1;
                    if (arr[result[c]] < arrI) {
                        u = c + 1;
                    }
                    else {
                        v = c;
                    }
                }
                if (arrI < arr[result[u]]) {
                    if (u > 0) {
                        p[i] = result[u - 1];
                    }
                    result[u] = i;
                }
            }
        }
        u = result.length;
        v = result[u - 1];
        while (u-- > 0) {
            result[u] = v;
            v = p[v];
        }
        return result;
    }
    function updateComponentPreRender(instance, nextVnode) {
        instance.vnode = nextVnode;
        instance.next = null;
        instance.props = nextVnode.props;
    }
    return {
        createApp: createAppApi(render)
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, preVal, nextVal) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === null || nextVal === undefined) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
//anchor指定插入位置
function insert(child, parent, anchor) {
    // parent.append(el)
    //anchor为空和append一样，
    parent.insertBefore(child, anchor);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(container, text) {
    container.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    h: h,
    renderSlots: renderSlots,
    createTextVNode: createTextVNode,
    createElementVNode: createVNode,
    getCurrentInstance: getCurrentInstance,
    registerRuntimeCompiler: registerRuntimeCompiler,
    provide: provide,
    inject: inject,
    createRenderer: createRenderer,
    nextTick: nextTick,
    toDisplayString: toDisplayString,
    ref: ref,
    proxyRefs: proxyRefs
});

const TO_DISPLAY_STRING = Symbol("toDisplayString");
const CREATE_ELEMENT_VNODE = Symbol(`createElementVNode`);
const helperMapName = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_VNODE]: "createElementVNode"
};

function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    //拼接导入
    genFunctionPreamble(ast, context);
    //拼接函数和参数
    const functionName = "render";
    const args = ["_ctx", "_cache"];
    const signature = args.join(",");
    push(`function ${functionName}(${signature}){`);
    //拼接返回值
    push("return ");
    genNode(ast.codegenNode, context);
    push("}");
    return {
        code: context.code
    };
}
//拼接导入的函数
function genFunctionPreamble(ast, context) {
    const { push } = context;
    const VueBinging = "Vue";
    const aliasHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;
    //不需要导入时不用加上
    if (ast.helpers.length > 0) {
        push(`const { ${ast.helpers.map(aliasHelper).join(", ")} } = ${VueBinging}`);
        push("\n");
    }
    push("return ");
}
//创建codegen的上下文，并封装+=的操作
function createCodegenContext() {
    const context = {
        code: "",
        push(source) {
            context.code += source;
        },
        //映射helper
        helper(key) {
            return `_${helperMapName[key]}`;
        }
    };
    return context;
}
//拼接节点（判断类型text，interpolation等）
function genNode(node, context) {
    switch (node.type) {
        case 4 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
        case 1 /* NodeTypes.INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 2 /* NodeTypes.SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 3 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
    }
}
function genCompoundExpression(node, context) {
    //遍历联合类型的children拼起来
    const { children } = node;
    const { push } = context;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        //判断+号
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    //统一处理假值为null
    genNodeList(genNullable([tag, props, children]), context);
    push(")");
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(node);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            push(", ");
        }
    }
}
function genNullable(args) {
    return args.map((arg) => arg || "null");
}
function genExpression(node, context) {
    const { push } = context;
    push(`${node.content}`);
}
function genText(node, context) {
    //text
    const { push } = context;
    push(`'${node.content}'`);
}
function genInterpolation(node, context) {
    //text
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(')');
}

function baseParse(content) {
    const context = createParseContext(content);
    return createRoot(parseChildren(context, []));
}
//解析孩子
function parseChildren(context, ancestors) {
    const nodes = [];
    //判断是否结束
    while (!isEnd(context, ancestors)) {
        let node, s = context.source;
        //判断是否{{开头 (插值)
        if (s.startsWith("{{")) {
            node = parseInterpolation(context);
        }
        //< + [a-z] (tag)
        else if (s[0] === "<") {
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }
        //node不存在表示文本
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function isEnd(context, ancestors) {
    const s = context.source;
    //2.遇到结束标签
    //遇到结束标签，与栈里的标签进行对比，如果存在,表示结束
    if (s.startsWith(`</`)) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const tag = ancestors[i].tag;
            if (startsWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }
    //1.source有值
    return !s;
}
//解析text
function parseText(context) {
    /*这里判断联合类型的模板解析，
    如果后面存在插值表达式或者elemnt，就是index就截取到{{的位置和<的位置中靠近左边的（取小的）,没有的话就还是原来的位置*/
    let endTokens = ["{{", "<"], endIndex = context.source.length;
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i]);
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    return {
        type: 4 /* NodeTypes.TEXT */,
        content
    };
}
function parseTextData(context, length) {
    //获取内容
    const content = context.source.slice(0, length);
    //推进
    advanceBy(context, length);
    return content;
}
//解析element
function parseElement(context, ancestors) {
    const element = parseTag(context, 0 /* TagType.START */);
    //ancestors作用,用来判断标签不存在结束标签导致死循环的问题，解析完之后入栈，parse完children之后出栈
    //把解析过的tag入栈
    ancestors.push(element);
    //递归解析放到children里,把解析出来的element传过去，用来判断结束标签
    element.children = parseChildren(context, ancestors);
    ancestors.pop();
    //判断开始标签和结束是否一样，不一样就抛出错误
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* TagType.END */);
    }
    else {
        throw new Error(`缺少结束标签${element.tag}`);
    }
    return element;
}
//判断开始结束tag是否相同
function startsWithEndTagOpen(source, tag) {
    return source.startsWith("</") && source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase();
}
//解析tag
function parseTag(context, type) {
    //1.解析tag
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    const tag = match[1];
    //2.删除处理完成的代码
    advanceBy(context, match[0].length);
    advanceBy(context, 1);
    //如果是结束标签就不需要返回值了
    if (type === 1 /* TagType.END */)
        return;
    return {
        type: 3 /* NodeTypes.ELEMENT */,
        tag
    };
}
//解析插值{{message}}
function parseInterpolation(context) {
    const openDelimiter = "{{", closeDelimiter = "}}";
    //获取}}的索引
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    //删除{{
    advanceBy(context, openDelimiter.length);
    // context.source = context.source.slice(openDelimiter.length);
    //获取中间部分的长度
    const rawContentLength = closeIndex - openDelimiter.length;
    //获取中间内容message
    const rawContent = parseTextData(context, rawContentLength);
    //去掉空格
    const content = rawContent.trim();
    //解析完之后删除}}，继续往后解析
    advanceBy(context, closeDelimiter.length);
    // context.source = context.source.slice(rawContentLength + closeDelimiter.length);
    return {
        type: 1 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 2 /* NodeTypes.SIMPLE_EXPRESSION */,
            content,
        }
    };
}
//往后推进
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
//创建根节点
function createRoot(children) {
    return {
        children,
        type: 0 /* NodeTypes.ROOT */
    };
}
//创建上下文
function createParseContext(content) {
    return {
        source: content
    };
}

function transform(root, options) {
    //创建上下文
    const context = createTransformContext(root, options);
    //1.深度优先搜索（递归）
    traverseNode(root, context);
    //创建根节点的children代码,便于直接拿到需要生成代码的节点
    createRootCodegen(root);
    root.helpers = [...context.helpers.keys()];
}
function createRootCodegen(root) {
    const child = root.children[0];
    //判断是否是element，如果是element，直接把子节点的codegenNode放到root上（中间层处理过），方便后续直接调用children
    if (child.type === 3 /* NodeTypes.ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = root.children[0];
    }
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        }
    };
    return context;
}
function traverseNode(node, context) {
    //这里通过传入函数，然后内部进行调用，并把需要用到的参数传出去
    //这样就可以实现扩展（plugin）
    //插件模式，洋葱模型
    const nodeTransforms = context.nodeTransforms;
    const exitFns = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transformPlugin = nodeTransforms[i];
        //这里为了防止插件影响了ast的结构导致其他插件出现问题
        //所以我们把transform几个插件返回函数，并记录下来
        //然后等执行完之后再执行，也就是延后执行，从而使其不相互干扰
        const onExit = transformPlugin(node, context);
        //只会收集会导致ast结构变化的插件
        //洋葱模式，先调用的后执行，后调用的先执行
        if (onExit)
            exitFns.push(onExit);
    }
    //判断类型
    switch (node.type) {
        //插值类型时调用全局上下文中的helper函数，存在helpers
        case 1 /* NodeTypes.INTERPOLATION */:
            context.helper(TO_DISPLAY_STRING);
            break;
        case 0 /* NodeTypes.ROOT */:
        case 3 /* NodeTypes.ELEMENT */:
            //递归处理子节点
            traverseChildren(node, context);
            break;
    }
    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
function traverseChildren(node, context) {
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const node = children[i];
        traverseNode(node, context);
    }
}

function createVNodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: 3 /* NodeTypes.ELEMENT */,
        tag,
        props,
        children
    };
}

function transformElement(node, context) {
    //需要延后执行，所以返回函数
    if (node.type === 3 /* NodeTypes.ELEMENT */) {
        return () => {
            //中间处理层
            //tag
            const vnodeTag = `'${node.tag}'`;
            //props
            let vnodeProps;
            //children
            const children = node.children;
            let vnodeChildren = children[0];
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

//表达式插件
//对表达式值进行处理，对节点类型为插值的节点，给他的content下面的content的值进行处理
//{{message}}  =>{type:interpolation,content: {type:expression,content:message}}
function transformExpression(node) {
    if (node.type === 1 /* NodeTypes.INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function isText(node) {
    return node.type === 4 /* NodeTypes.TEXT */ || node.type === 1 /* NodeTypes.INTERPOLATION */;
}

function transformText(node) {
    if (node.type === 3 /* NodeTypes.ELEMENT */) {
        //TODO,添加中间层复合类型的节点
        //返回函数，延后执行
        return () => {
            const { children } = node;
            let currentContainer;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                //首先需要判断是否为text类型或者插值，只有是这两者的时候，才会对相邻的下一个节点就行判断
                if (isText(child)) {
                    //判断相邻节点
                    for (let j = i + 1; i < children.length; i++) {
                        const next = children[j];
                        if (isText(next)) {
                            //将原来的节点替换,next删除
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                    children: [child]
                                };
                            }
                            currentContainer.children.push(" + ");
                            currentContainer.children.push(next);
                            children.splice(j, 1);
                            j--;
                        }
                        else {
                            //遇到不是上述两种节点，直接跳出循环
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

//编译函数
function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText]
    });
    return generate(ast);
}

//编译成函数
function compileToFunction(template) {
    const { code } = baseCompile(template);
    //通过new Function生成函数
    const render = new Function("Vue", code)(runtimeDom);
    return render;
}
registerRuntimeCompiler(compileToFunction);

exports.createApp = createApp;
exports.createElementVNode = createVNode;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.nextTick = nextTick;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.ref = ref;
exports.registerRuntimeCompiler = registerRuntimeCompiler;
exports.renderSlots = renderSlots;
exports.toDisplayString = toDisplayString;
