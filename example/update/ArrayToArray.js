import { h,ref } from "../../lib/guide-mini-vue.esm.js";

//左侧对比
// const prevChildren = [h("div",{key:"A"},"A"),h("div",{key:"B"},"B"),h("div",{key:"C"},"C")];
// const nextChildren = [h("div",{key:"A"},"A"),h("div",{key:"B"},"B"),h("div",{key:"D"},"D"),h("div",{key:"E"},"E")];


//右侧对比
// const prevChildren = [h("div",{key:"A"},"A"),h("div",{key:"B"},"B"),h("div",{key:"C"},"C")];
// const nextChildren = [h("div",{key:"D"},"D"),h("div",{key:"E"},"E"),h("div",{key:"B"},"B"),h("div",{key:"C"},"C")];

//新的大于老的
// const prevChildren = [h("div",{key:"A"},"A"),h("div",{key:"B"},"B")];
// const nextChildren = [h("div",{key:"A"},"A"),h("div",{key:"B"},"B"),h("div",{key:"C"},"C"),h("div",{key:"D"},"D")];

// const prevChildren = [h("div",{key:"A"},"A"),h("div",{key:"B"},"B")];
// const nextChildren = [h("div",{key:"C"},"C"),h("div",{key:"D"},"D"),h("div",{key:"A"},"A"),h("div",{key:"B"},"B")];

//老的大于新的
// const prevChildren = [h("div",{key:"A"},"A"),h("div",{key:"B"},"B"),h("div",{key:"C"},"C"),h("div",{key:"D"},"D")];
// const nextChildren = [h("div",{key:"A"},"A"),h("div",{key:"B"},"B")];


// const prevChildren = [h("div",{key:"C"},"C"),h("div",{key:"D"},"D"),h("div",{key:"A"},"A"),h("div",{key:"B"},"B")];
// const nextChildren = [h("div",{key:"A"},"A"),h("div",{key:"B"},"B")];


//中间对比
//1.删除新的里面不存在的节点
// const prevChildren = [
//     h("div",{key:"A"},"A"),
//     h("div",{key:"B"},"B"),
//     h("div",{key:"C",id:"prev-c"},"C"),
//     h("div",{key:"D"},"D"),
//     h("div",{key:"F"},"F"),
//     h("div",{key:"G"},"G")
// ];

// const prevChildren = [
//     h("div",{key:"A"},"A"),
//     h("div",{key:"B"},"B"),
//     h("div",{key:"C",id:"prev-c"},"C"),
//     h("div",{key:"E"},"E"),
//     h("div",{key:"D"},"D"),
//     h("div",{key:"F"},"F"),
//     h("div",{key:"G"},"G")
// ];
// const nextChildren = [
//     h("div",{key:"A"},"A"),
//     h("div",{key:"B"},"B"),
//     h("div",{key:"E"},"E"),
//     h("div",{key:"C" ,id:"next-c"},"C"),
//     h("div",{key:"F"},"F"),
//     h("div",{key:"G"},"G")
// ];

//移动节点
// const prevChildren = [
//     h("div",{key:"A"},"A"),
//     h("div",{key:"B"},"B"),
//     h("div",{key:"C"},"C"),
//     h("div",{key:"D"},"D"),
//     h("div",{key:"E"},"E"),
//     h("div",{key:"F"},"F"),
//     h("div",{key:"G"},"G")
// ];
// const nextChildren = [
//     h("div",{key:"A"},"A"),
//     h("div",{key:"B"},"B"),
//     h("div",{key:"E"},"E"),
//     h("div",{key:"C"},"C"),
//     h("div",{key:"D"},"D"),
//     h("div",{key:"Q"},"Q"),
//     h("div",{key:"F"},"F"),
//     h("div",{key:"G"},"G")
// ];


//综合
const prevChildren = [
    h("div",{key:"A"},"A"),
    h("div",{key:"B"},"B"),
    h("div",{key:"C"},"C"),
    h("div",{key:"D"},"D"),
    h("div",{key:"E"},"E"),
    h("div",{key:"Z"},"Z"),
    h("div",{key:"F"},"F"),
    h("div",{key:"G"},"G")
];
const nextChildren = [
    h("div",{key:"A"},"A"),
    h("div",{key:"B"},"B"),
    h("div",{key:"D"},"D"),
    h("div",{key:"C"},"C"),
    h("div",{key:"Y"},"Y"),
    h("div",{key:"E"},"E"),
    h("div",{key:"F"},"F"),
    h("div",{key:"G"},"G")
];

export const ArrayToArray = {
    name:"ArrayToArray",
    setup() {
        const isChange = ref(false);
        window.isChange = isChange;
        return {
            isChange
        }
    },
    render() {
        const self = this;
        return self.isChange === true ?
        h("div",{},nextChildren) :
        h("div",{},prevChildren)

    }
}