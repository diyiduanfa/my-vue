import {createRenderer} from "../runtime-core/index"
function createElement(type) {
    return document.createElement(type)
}

function patchProp(el,key,preVal,nextVal) {
    const isOn = (key:string) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event,nextVal);
    } else {
        if (nextVal === null || nextVal === undefined ) {
            el.removeAttribute(key)
        } else {
            el.setAttribute(key,nextVal)
        }
       
    }

}
//anchor指定插入位置
function insert(child,parent,anchor) {
    // parent.append(el)
    //anchor为空和append一样，
    parent.insertBefore(child,anchor)
}

function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}

function setElementText(container,text) {
    container.textContent = text;
}

const renderer:any = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
})

export function createApp(...args) {
    return renderer.createApp(...args);
}

export * from "../runtime-core/index"