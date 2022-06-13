import { effect } from "../effect";
import { reactive } from "../reactive";
import {ref,isRef,unRef,proxyRefs} from "../ref"
describe("ref",() => {
    it("happy path",() => {
        const a = ref(1);
        expect(a.value).toBe(1);
    })
    it("should be reactive",() => {
        const a = ref(1);
        let dummy;
        let calls = 0;
        effect( () => {
            calls++;
            dummy = a.value;
        });
        expect(calls).toBe(1);
        expect(dummy).toBe(1);
        a.value = 2;
        expect(calls).toBe(2);
        expect(dummy).toBe(2);

        a.value = 2;
        expect(calls).toBe(2);
        expect(dummy).toBe(2);

    })
    it("ref be reactive",() => {
        const a = ref({
            count:1
        });
        let dummy;
        effect(() => {
            dummy = a.value.count
        });
        expect(dummy).toBe(1);
        a.value.count = 2;
        expect(dummy).toBe(2)
    })
    it("isRef unRef",() => {
        const a = ref(1);
        const b = reactive({
            c:1
        })
        expect(isRef(a)).toBe(true);
        expect(isRef(b)).toBe(false);
        expect(isRef(1)).toBe(false);
        expect(unRef(a)).toBe(1);
        expect(unRef(a)).toBe(1);
    })
    it("proxyRefs",() => {
        const user = {
            age:ref(10),
            name:"xiaohong"
        };

        const proxyUser = proxyRefs(user);
        expect(user.age.value).toBe(10);
        expect(proxyUser.age).toBe(10);
        expect(proxyUser.name).toBe("xiaohong");

        proxyUser.age = 20;
        
        //set时候判断如果set值不是ref，修改value
        expect(proxyUser.age).toBe(20);
        expect(user.age.value).toBe(20);

        proxyUser.age = ref(30);
        expect(proxyUser.age).toBe(30);
        expect(user.age.value).toBe(30);


    })
})