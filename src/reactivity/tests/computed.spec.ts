import { reactive } from "../reactive"
import {computed} from "../computed"
describe("computed",() => {
    it("happy path",() => {
        const user = reactive({
            age:10
        });
        const age = computed(() => {
            return user.age;
        });
        expect(age.value).toBe(10);
    })
    it("should be lazy",() => {
        const value = reactive({
            foo:1
        });
        const getter = jest.fn(() => {
            return value.foo
        });
        const cvalue = computed(getter);

        //lazy
        expect(getter).not.toHaveBeenCalled();

        expect(cvalue.value).toBe(1);
        expect(getter).toHaveBeenCalledTimes(1);

        //should not compute again
        cvalue.value;
        expect(getter).toHaveBeenCalledTimes(1);

        //should not compute until needed
        value.foo = 2;
        expect(getter).toHaveBeenCalledTimes(1);

        //now it should computed
        expect(cvalue.value).toBe(2);
        expect(getter).toHaveBeenCalledTimes(2);

        cvalue.value;
        expect(getter).toHaveBeenCalledTimes(2);


    })
})