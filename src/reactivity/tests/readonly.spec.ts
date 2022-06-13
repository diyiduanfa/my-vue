import {readonly,isReadOnly,shallowReadonly} from "../reactive"
describe("readonly",() => {
    it("happy path",() => {
        const original = {foo:1,bar:{baz:2}};
        const wrapped = readonly(original);
        expect(wrapped).not.toBe(original);
        expect(wrapped.foo).toBe(1);
    })
    it("warn",() => {
        console.warn = jest.fn();
        const user = readonly({
            age:20,
            q:{
                c:{x:123}
            }
        });
        user.age = 11;
        expect(console.warn).toBeCalled();
        expect(isReadOnly(user.q.c)).toBe(true);
    }),
    it("warn1",() => {
        console.warn = jest.fn();
        const user = shallowReadonly({
            age:20,
            q:{
                c:{x:123}
            }
        });
        user.age = 11;
        expect(console.warn).toBeCalled();
        expect(isReadOnly(user.q.c)).toBe(false);
    })
})