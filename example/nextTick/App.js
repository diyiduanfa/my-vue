import { getCurrentInstance, h,ref,nextTick } from "../../lib/guide-mini-vue.esm.js";
export const App = {
    name:"App",
    setup() {
        let count = ref(0);

       const instance = getCurrentInstance();
 
        const addCount = () => {
            for (let i=0;i<100;i++) {
                count.value = i;
            }
            //响应式数据更新时，由于是异步更新，所以并不能拿到更新后的视图
            console.log(instance);
            //获取更新之后的视图
            nextTick(() => {
              console.log(instance);
            });

            //await nextTick()
        };

        

        return {
            count,
            addCount
        }

    },
    render() {
        return h("div",{},[
            h("button",{
                onClick:this.addCount
            },"change self count"),
            h("p",{},"count:" + this.count)
        ])

    }
}