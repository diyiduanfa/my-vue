import { NodeTypes } from "../src/ast"
import { baseParse } from "../src/parse"

describe("Parse",() => {
    describe("interpolation",() => {
        test("simple interpolation",() => {
            const ast = baseParse("{{message}}")

            //root
            expect(ast.children[0]).toStrictEqual({
                type:NodeTypes.INTERPOLATION,
                content:{
                    type:NodeTypes.SIMPLE_EXPRESSION,
                    content:"message"
                }

            })
        })
    })

    describe("element",() => {
        test("simple element div",() => {
            const ast = baseParse("<div></div>")

            //root
            expect(ast.children[0]).toStrictEqual({
                type:NodeTypes.ELEMENT,
                tag:"div",
                children:[],

            })
        })
    })

    describe("text",() => {
        test("some text",() => {
            const ast = baseParse("some text")

            //root
            expect(ast.children[0]).toStrictEqual({
                type:NodeTypes.TEXT,
                content:"some text"

            })
        })
    })

    test("hello world",() => {
        const ast = baseParse("<p><div>hi</div>{{{{message}}</p>");
        expect(ast.children[0]).toStrictEqual({
            type:NodeTypes.ELEMENT,
            tag:"p",
            children:[
                {
                    type:NodeTypes.ELEMENT,
                    tag:"div",
                    children:[
                        {
                            type:NodeTypes.TEXT,
                            content:"hi"
                        }
                    ] 
                },
                {
                    type:NodeTypes.INTERPOLATION,
                    content:{
                        type:NodeTypes.SIMPLE_EXPRESSION,
                        content:"{{message"
                    }
                }
            ]
        })
    })


    test("should throw",() => {
        expect(() => {
            baseParse("<div><span></div>")
        }).toThrow("缺少结束标签span");
        // const ast = baseParse("<p><div>hi</div>{{message}}</p>");
        // expect(ast.children[0]).toStrictEqual({
        //     type:NodeTypes.ELEMENT,
        //     tag:"p",
        //     children:[
        //         {
        //             type:NodeTypes.ELEMENT,
        //             tag:"div",
        //             children:[
        //                 {
        //                     type:NodeTypes.TEXT,
        //                     content:"hi"
        //                 }
        //             ] 
        //         },
        //         {
        //             type:NodeTypes.INTERPOLATION,
        //             content:{
        //                 type:NodeTypes.SIMPLE_EXPRESSION,
        //                 content:"message"
        //             }
        //         }
        //     ]
        // })
    })
})