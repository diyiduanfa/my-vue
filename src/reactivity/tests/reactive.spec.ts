import {reactive,isReactive, readonly, isReadOnly,isProxy} from "../reactive"
describe("reactive",() => {
    it("happy path", () => {
        const original = { foo :1 };
        const observe = reactive(original);
        expect(observe).not.toBe(original);
        expect(observe.foo).toBe(1);
    }),
    it("isReactive isReadOnly",() => {
        const original = {
            foo:1,
            bar:{a:123},
            array:[{x:123}]
        };
        const observed = reactive(original);
        const observedReadOnly = readonly(original);
        expect(observed).not.toBe(original);
        expect(observed.foo).toBe(1);
        expect(isReactive(observed)).toBe(true);
        expect(observedReadOnly.foo).toBe(1);
        expect(isReadOnly(observedReadOnly)).toBe(true);
        expect(isReactive(observed.bar)).toBe(true);
        expect(isReactive(observed.array[0])).toBe(true);
        expect(isProxy(observed)).toBe(true);
        expect(isProxy(observedReadOnly)).toBe(true);
    })
})