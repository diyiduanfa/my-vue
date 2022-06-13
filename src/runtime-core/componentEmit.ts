export function emit(instance,event,...args) {
    //找到props里面的event
    const {props} = instance;

    //处理首字母大写，拼出props里面的事件名（onAdd）
    //add - Add
    const capitalize = (str:string) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    //add-foo -> AddFoo
    const camelize = (str:string) => {
        return str.replace(/-(\w)/g,(_,c:string) => {
            return c ? c.toUpperCase() : ""
        })
    }

    const toHandleKey = (str:string) => {
        return str ? "on" + capitalize(str) : ""
    }

    const handlerName = toHandleKey(camelize(event));
    const handler = props[handlerName];

    handler && handler(...args);
    
}