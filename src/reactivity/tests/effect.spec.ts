import {reactive} from "../reactive";
import {effect,stop} from "../effect";
describe('effect',() => {
    it('happy path',() => {
        const user = reactive({
            age:10
        });
        let nextAge;
        effect(() => {
            nextAge = user.age + 1;
        });

        expect(nextAge).toBe(11);

        //update
        user.age ++;
        expect(nextAge).toBe(12);

    })

    it("should runner",() => {
        //effect(fn) -> function(runner) -> fn -> return
        let foo = 10;
        const runner = effect(() => {
            foo++;
            return "foo"
        });
        expect(foo).toBe(11);
        let r = runner();
        expect(foo).toBe(12);
        expect(r).toBe("foo")
    })

    it("schedular",() => {
        //1.通过effect 的第二个参数给定一个schedular的fn
        //2.effect第一次执行的时候还会执行fn
        //3.当响应式对象set update不行执行fn，而是执行schedular
        //4.如果说当执行runner的时候，会再次执行fn
        let dummy;
        let run:any;
        const schedular = jest.fn(() => {
            run = runner;
        });
        const obj = reactive({foo:1});
        const runner = effect(
            () => {
                dummy = obj.foo;
            },
            {schedular}
        );
        expect(schedular).not.toHaveBeenCalled();
        expect(dummy).toBe(1);
        //应该被调用第一次trigger
        obj.foo++;
        expect(schedular).toHaveBeenCalledTimes(1);
        //还没调用run
        expect(dummy).toBe(1);
        //调用run
        run();
        expect(dummy).toBe(2);

    })

    it("stop",() => {
        let dummy;
        const obj = reactive({prop:1});
        const runner = effect(() => {
            dummy = obj.prop;
        });
        obj.prop = 2;
        expect(dummy).toBe(2);
        stop(runner);
        // obj.prop = 3;
        //既触发了get，又触发了set
        obj.prop ++;
        expect(dummy).toBe(2);
        runner();
        expect(dummy).toBe(3);
    })

    it("onStop",() => {
        //在stop完成之后调用
        const obj = reactive({
            foo:1
        });
        const onStop = jest.fn();
        let dummy;
        const runner = effect(
            () => {
                dummy = obj.foo;
            },
            {
                onStop
            }
        );
        stop(runner);
        expect(onStop).toBeCalledTimes(1);
    })
})