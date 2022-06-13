import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initProps } from "./componentProps";
import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { initSlots } from "./componentSlots";
import { proxyRefs } from "../reactivity/index"
export function createComponentInstance(vnode,parent) {
    const component = {
        vnode,
        type:vnode.type,
        next:null,
        setupState:{},
        props:{},
        slots:{},
        provides:parent ? parent.provides:{},
        parent,
        isMounted:false,
        subTree:{},
        emit:() => {}
    }

    component.emit = emit.bind(null,component) as any;
    return component
}

export function setupComponent(instance) {
    //todo
    initProps(instance,instance.vnode.props);
    initSlots(instance,instance.vnode.children);
    //处理有状态的组件
    setupStatefulComponent(instance);
}

function setupStatefulComponent(instance:any) {
    const Component = instance.type;

    //ctx
    instance.proxy = new Proxy({_:instance},PublicInstanceProxyHandlers)



    const {setup} = Component;

    if (setup) {
        //function(render) ,obj
        setCurrentInstance(instance)
        const setupResult = setup(shallowReadonly(instance.props),{
            emit:instance.emit
        });
        setCurrentInstance(null)
        handleSetupResult(instance,setupResult);
    }

}

function handleSetupResult(instance:any,setupResult:any) {
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
            Component.render = compiler(Component.template)
        }
        
    }

    instance.render = Component.render;

}

//当前实例
let currentInstance = null;
export function getCurrentInstance() {
    return currentInstance
}

function setCurrentInstance(instance) {
    currentInstance = instance;
}


//提供一函数来拿到模板编译生成的render
let compiler;
export function registerRuntimeCompiler(_compiler) {
    compiler = _compiler
}