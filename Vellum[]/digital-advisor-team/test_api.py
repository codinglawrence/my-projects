"""测试 API"""
import requests
import json
import sys

BASE_URL = "http://localhost:8080"

def save_result(name, data):
    """保存结果到文件"""
    with open(f'test_result_{name}.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"结果已保存到 test_result_{name}.json")

def test_health():
    """测试健康检查"""
    print("=== 测试健康检查 ===")
    r = requests.get(f"{BASE_URL}/health")
    print(f"状态: {r.status_code}")
    if r.status_code == 200:
        print("健康检查通过")
        return True
    else:
        print(f"错误: {r.text}")
        return False

def test_get_bloggers():
    """测试获取博主列表"""
    print("\n=== 测试获取博主列表 ===")
    r = requests.get(f"{BASE_URL}/knowledge/bloggers")
    print(f"状态: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"博主数量: {len(data)}")
        if data:
            print(f"第一个博主: {data[0]['name']}")
        return data
    else:
        print(f"错误: {r.text}")
        return []

def test_create_conversation(blogger_id):
    """测试创建对话"""
    print(f"\n=== 测试创建对话 (blogger_id={blogger_id}) ===")
    r = requests.post(
        f"{BASE_URL}/conversation/conversations",
        json={"blogger_id": blogger_id, "title": "测试对话"}
    )
    print(f"状态: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"对话ID: {data['id']}")
        return data['id']
    else:
        print(f"错误: {r.text}")
        return None

def test_chat(conversation_id, message, round_num):
    """测试聊天"""
    print(f"\n=== 第{round_num}轮对话 (conversation_id={conversation_id}) ===")
    print(f"用户消息: {message}")
    
    r = requests.post(
        f"{BASE_URL}/conversation/conversations/{conversation_id}/chat",
        json={"user_message": message, "style_description": "科技博主，专业但友好"}
    )
    print(f"状态: {r.status_code}")
    
    if r.status_code == 200:
        data = r.json()
        save_result(f"round_{round_num}", data)
        print(f"AI回复已保存")
        print(f"使用了上下文: {data.get('context_used', False)}")
        print(f"行动: {data.get('action', '无')}")
        return data
    else:
        print(f"错误: {r.text}")
        return None

def test_memory_stats(conversation_id):
    """测试记忆统计"""
    print(f"\n=== 测试记忆统计 (conversation_id={conversation_id}) ===")
    r = requests.get(f"{BASE_URL}/conversation/conversations/{conversation_id}/memory-stats")
    print(f"状态: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        save_result("memory_stats", data)
        print("记忆统计已保存")
    else:
        print(f"错误: {r.text}")

if __name__ == "__main__":
    # 测试健康检查
    if not test_health():
        print("健康检查失败，服务可能未启动")
        sys.exit(1)
    
    # 获取博主列表
    bloggers = test_get_bloggers()
    if not bloggers:
        print("没有博主，请先创建博主")
        sys.exit(1)
    
    blogger_id = bloggers[0]['id']
    
    # 创建对话
    conversation_id = test_create_conversation(blogger_id)
    if not conversation_id:
        print("创建对话失败")
        sys.exit(1)
    
    # 测试多轮对话
    print("\n" + "="*50)
    print("开始多轮对话测试")
    print("="*50)
    
    # 第一轮 - 自我介绍
    test_chat(conversation_id, "你好，我叫张三，是一名软件工程师，对人工智能很感兴趣。", 1)
    
    # 第二轮 - 测试短期记忆
    test_chat(conversation_id, "你还记得我的名字吗？", 2)
    
    # 第三轮 - 深入话题
    test_chat(conversation_id, "能给我推荐一些学习 AI 的资源吗？", 3)
    
    # 第四轮 - 回到之前的话题
    test_chat(conversation_id, "刚才你说到我是软件工程师，你觉得我应该重点学习 AI 的哪些方面？", 4)
    
    # 查看记忆统计
    test_memory_stats(conversation_id)
    
    print("\n" + "="*50)
    print("测试完成！请查看 test_result_*.json 文件")
    print("="*50)
