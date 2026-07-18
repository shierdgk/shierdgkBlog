## 前言

在蒜泥科技实习时，wellnesshub 项目需要大量回归接口。我之前只会手搓 curl，接口一多就崩溃。于是从零学 pytest + requests 搭接口自动化，最终跑起 200+ 条稳定用例。记录核心经验和坑。

## 一、从 curl 到 requests

最早验证接口就是贴 curl 命令，参数一变就改半天，结果也不好断言。换成 requests 后，请求和断言都能写成代码：

~~~python
import requests

def test_login_ok():
    r = requests.post(
        "https://api.example.com/login",
        json={"phone": "13800000000", "code": "123456"},
    )
    assert r.status_code == 200
    assert r.json()["code"] == 0
~~~

能写断言，才是「自动化」的开始。

## 二、用 fixture 管理环境和登录态

重复写 base_url、重复登录太烦。pytest 的 fixture 正好解决：

~~~python
import pytest

@pytest.fixture
def base_url():
    return "https://api.example.com"

@pytest.fixture
def token(base_url):
    r = requests.post(f"{base_url}/login", json={})
    return r.json()["data"]["token"]
~~~

需要登录态的用例直接把 `token` 当参数，pytest 自动注入。

## 三、数据清理比写用例更重要

接口测试最大的坑是「脏数据」：用例 A 建了条数据，用例 B 依赖它，顺序一变就挂。我的原则：每个用例自己造数据、自己清，不依赖执行顺序。删除接口不稳就靠数据库直连回滚。

## 四、参数化覆盖异常场景

~~~python
@pytest.mark.parametrize("phone, expected", [
    ("", "手机号不能为空"),
    ("123", "手机号格式错误"),
])
def test_phone_invalid(base_url, phone, expected):
    r = requests.post(f"{base_url}/login", json={"phone": phone})
    assert expected in r.json()["msg"]
~~~

一条测试函数覆盖多组异常，性价比极高。

> 接口自动化的价值不在「跑通一次」，在「每次发版都能放心点一下」。稳定、可重复，比用例数量重要。

## 小结

pytest + requests 上手成本很低，但要写好得懂 fixture、参数化、数据隔离。这三件套吃透，接口回归就从噩梦变日常。
