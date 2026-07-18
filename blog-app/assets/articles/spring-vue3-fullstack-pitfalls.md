## 前言：为什么想写这篇

在软件工作室做独立项目时，我从头到尾负责一个「专家智库」系统的前后端。技术栈 SpringBoot + Vue3 + MyBatis + MySQL。当时觉得组合主流、资料多，实际做下来才发现：资料多归多，讲清楚「怎么把前后端串起来跑通完整流程」的很少。

这篇把我踩的坑按阶段整理，每个坑附上错误做法和正确解法。

## 一、初始化阶段：别小看目录结构

### 坑1：后端没有统一返回格式

最开始每个 Controller 直接 return 对象，前端拿到的数据格式五花八门。要加状态码、分页元数据，所有地方都得改。

后来定义统一 `Result<T>`：

~~~java
public class Result<T> {
    private int code;
    private String msg;
    private T data;
    public static <T> Result<T> ok(T data) {
        return new Result<>(200, "success", data);
    }
}
~~~

前端只要认 `code / msg / data`，再也不怕接口返参乱跳。

### 坑2：跨域一股脑放行

开发期图省事 `@CrossOrigin` 全开，上线忘了收敛。正确做法：开发用代理（Vite proxy），生产靠网关统一处理，别把 CORS 写成永久全开。

## 二、业务阶段：联表与分页

MyBatis 联表我一开始用嵌套 `resultMap`，复杂查询一多就乱。后来简单查询用注解 `@Select`，复杂报表才上 XML，清晰很多。

分页别在代码里手写 limit，直接上 PageHelper 或 MyBatis-Plus 的分页插件，前端传 `page / size`，后端返 `total`。

## 三、部署阶段：配置分离

最坑的一次是把数据库密码写死在代码里，本地能跑，上服务器连不上。正确做法：用 `application.yml` + 环境变量，本地 / 测试 / 生产各一套 profile，敏感信息走环境变量。

> 全栈最贵的不是写功能，是把「本地能跑」变成「哪都能跑」。配置、依赖、环境，一样都不能写死。

## 小结

全栈项目真正的门槛不是某个框架，而是「前后端怎么优雅地约定接口、怎么把环境差异隔离掉」。把这两件事想清楚，后面的路会顺很多。
