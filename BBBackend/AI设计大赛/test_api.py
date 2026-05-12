import httpx
import asyncio

async def test_chat_start():
    print('=== 测试修复后的 API ===\n')
    
    # 1. 人格蒸馏（先创建两个智能体）
    print('1. 创建两个智能体')
    async with httpx.AsyncClient() as client:
        # 智能体A
        await client.post('http://localhost:8001/api/agent/algo/model-refresh', json={
            'user_id': 'test_user_001',
            'agent_id': 'test_agent_001',
            'speak_style': '幽默风趣',
            'character': '外向开朗',
            'love_style': '浪漫型',
            'values_view': {
                'marriage_view': '婚姻是人生大事',
                'money_view': '钱够用就好',
                'family_view': '重视家庭'
            },
            'taboo': {
                'hate_behavior': ['出轨', '冷暴力'],
                'hate_habit': ['赌博', '酗酒']
            }
        })
        # 智能体B
        await client.post('http://localhost:8001/api/agent/algo/model-refresh', json={
            'user_id': 'test_user_002',
            'agent_id': 'test_agent_002',
            'speak_style': '温柔体贴',
            'character': '内向文静',
            'love_style': '体贴型',
            'values_view': {
                'marriage_view': '婚姻是爱情的延续',
                'money_view': '合理规划',
                'family_view': '家庭至上'
            },
            'taboo': {
                'hate_behavior': ['欺骗', '背叛'],
                'hate_habit': ['熬夜', '拖延']
            }
        })
        print('   两个智能体创建成功\n')
    
    # 2. 启动双AI对话
    print('2. 启动双AI对话')
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post('http://localhost:8001/api/agent/algo/chat-start', json={
                'match_id': 'test_match_001',
                'agent_id_a': 'test_agent_001',
                'agent_id_b': 'test_agent_002',
                'round_limit': 5
            })
            print(f'   Status: {resp.status_code}')
            result = resp.json()
            print(f'   Response: {result}\n')
            
            if result['code'] == 200:
                session_id = result['data']['session_id']
                
                # 3. 获取聊天记录
                print('3. 获取聊天记录')
                await asyncio.sleep(2)  # 等待对话生成
                resp = await client.get(f'http://localhost:8001/api/agent/algo/chat-record?session_id={session_id}')
                print(f'   Status: {resp.status_code}')
                record_data = resp.json()['data']
                print(f'   消息数: {len(record_data["records"])}')
                print(f'   对话状态: {record_data["chat_status"]}\n')
                
                for msg in record_data['records']:
                    print(f'   [{msg["speaker"]}] {msg["content"]}')
                
                print()
        except Exception as e:
            print(f'   Error: {e}\n')
    
    print('=== 测试完成 ===')

asyncio.run(test_chat_start())