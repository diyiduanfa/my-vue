import { getCurrentInstance } from "./component";
export function provide(key,value) {
    const currentInstance:any = getCurrentInstance();
    if (currentInstance) {
        let {provides} = currentInstance;

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


export function inject(key,defaultValue) {
    const currentInstance:any = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key]
        } else if(defaultValue){
            if (typeof defaultValue === "function") {
                return defaultValue()
            }
            return defaultValue
        }
      
    }
}