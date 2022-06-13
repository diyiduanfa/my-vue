import { NodeTypes } from "./ast";

const enum TagType {
    START,
    END
}

export function baseParse(content:string) {
    const context = createParseContext(content);

    return createRoot(parseChildren(context,[]))
   
    
}


//解析孩子
function parseChildren(context,ancestors) {

    const nodes:any = [];
    //判断是否结束
    while(!isEnd(context,ancestors)) {
        let node,
        s = context.source;
        //判断是否{{开头 (插值)
        if (s.startsWith("{{")) {
            node = parseInterpolation(context);
        } 
        //< + [a-z] (tag)
        else if (s[0] === "<") {
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context,ancestors);
            }
        }

        //node不存在表示文本
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);

    }
    
    return nodes

}


function isEnd(context,ancestors) {
    const s = context.source;
    
    
   //2.遇到结束标签
   //遇到结束标签，与栈里的标签进行对比，如果存在,表示结束
    if (s.startsWith(`</`)) {
        for (let i = ancestors.length - 1;i >=0;i--) {
            const tag = ancestors[i].tag; 
            if (startsWithEndTagOpen(s,tag)) {
                return true
            }
        }
    }

    //1.source有值
    return !s
   

}

//解析text
function parseText(context) {

    
    /*这里判断联合类型的模板解析，
    如果后面存在插值表达式或者elemnt，就是index就截取到{{的位置和<的位置中靠近左边的（取小的）,没有的话就还是原来的位置*/
    let endTokens = ["{{","<"],
    endIndex = context.source.length;
    for (let i=0;i<endTokens.length;i++) {
        const index = context.source.indexOf(endTokens[i]);
        if (index !== -1 && endIndex > index) {
            endIndex = index
        }
    }
   
    const content = parseTextData(context,endIndex);
    
    return {
        type:NodeTypes.TEXT,
        content
    }
}

function parseTextData(context,length) {
    //获取内容
    const content = context.source.slice(0,length);
    
    //推进
    advanceBy(context,length);

    return content
}

//解析element
function parseElement(context,ancestors) {
   const element:any = parseTag(context,TagType.START);

   //ancestors作用,用来判断标签不存在结束标签导致死循环的问题，解析完之后入栈，parse完children之后出栈
   //把解析过的tag入栈
   ancestors.push(element);
   //递归解析放到children里,把解析出来的element传过去，用来判断结束标签
   element.children = parseChildren(context,ancestors);
   ancestors.pop();

   //判断开始标签和结束是否一样，不一样就抛出错误

   if (startsWithEndTagOpen(context.source,element.tag)) {
    parseTag(context,TagType.END);
   } else {
       throw new Error(`缺少结束标签${element.tag}`)
   }
  
   
   return element
}

//判断开始结束tag是否相同
function startsWithEndTagOpen(source,tag) {
    return source.startsWith("</") && source.slice(2,2+tag.length).toLowerCase() === tag.toLowerCase()

}

//解析tag
function parseTag(context,type:TagType) {
     //1.解析tag
     const match:any = /^<\/?([a-z]*)/i.exec(context.source);
     const tag = match[1];
 
     //2.删除处理完成的代码
     advanceBy(context,match[0].length);
     advanceBy(context,1);

     //如果是结束标签就不需要返回值了
     if (type === TagType.END) return

     return {
        type:NodeTypes.ELEMENT,
        tag
    }
}

//解析插值{{message}}
function parseInterpolation(context) {


    const openDelimiter = "{{",
    closeDelimiter = "}}";


    //获取}}的索引
    const closeIndex = context.source.indexOf(
        closeDelimiter,
        openDelimiter.length
    );

    //删除{{
    advanceBy(context,openDelimiter.length);
    // context.source = context.source.slice(openDelimiter.length);

    //获取中间部分的长度
    const rawContentLength = closeIndex - openDelimiter.length;

    //获取中间内容message
    const rawContent = parseTextData(context,rawContentLength);
    //去掉空格
    const content = rawContent.trim();

    //解析完之后删除}}，继续往后解析
    advanceBy(context,closeDelimiter.length);
    // context.source = context.source.slice(rawContentLength + closeDelimiter.length);
    
    

    return {
        type:NodeTypes.INTERPOLATION,
        content:{
            type:NodeTypes.SIMPLE_EXPRESSION,
            content,
        }
    }

}

//往后推进
function advanceBy(context:any,length:number) {
    context.source = context.source.slice(length);
}

//创建根节点
function createRoot(children) {
    return {
        children,
        type:NodeTypes.ROOT
    }

}
//创建上下文
function createParseContext(content:string):any {
    return {
        source:content
    }

}