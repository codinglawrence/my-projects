import React, { useState, useEffect } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import './index.css'

// Mock data for development
const mockPrompts = [
  {
    id: '1',
    title: 'AI 绘画提示词',
    content: '生成一幅未来主义风格的城市景观，带有霓虹灯和飞行汽车',
    tags: ['绘画', '未来主义'],
    isFavorite: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorId: 'user123'
  },
  {
    id: '2',
    title: '文章写作提示词',
    content: '写一篇关于人工智能对教育影响的文章，包含具体例子',
    tags: ['写作', '教育'],
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorId: 'user123'
  }
]

const Index = () => {
  const [prompts, setPrompts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  useEffect(() => {
    setPrompts(mockPrompts)
  }, [])

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prompt.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFavorite = showFavoritesOnly ? prompt.isFavorite : true
    return matchesSearch && matchesFavorite
  })

  const toggleFavorite = (id) => {
    setPrompts(prompts.map(prompt => 
      prompt.id === id ? { ...prompt, isFavorite: !prompt.isFavorite } : prompt
    ))
  }

  return (
    <View className='container'>
      {/* Header */}
      <View className='header'>
        <Text className='title'>PromptMaster</Text>
        <Text className='subtitle'>智能提示词管理器</Text>
      </View>

      {/* Search Bar */}
      <View className='search-bar'>
        <Input
          placeholder='搜索提示词...'
          value={searchQuery}
          onInput={e => setSearchQuery(e.detail.value)}
          className='search-input'
        />
      </View>

      {/* Filter Controls */}
      <View className='filter-controls'>
        <View 
          className={showFavoritesOnly ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <Text>仅显示收藏</Text>
        </View>
      </View>

      {/* Prompts List */}
      <ScrollView className='prompts-container' scrollY>
        {filteredPrompts.length === 0 ? (
          <View className='empty-state'>
            <Text>暂无提示词</Text>
          </View>
        ) : (
          <View className='list-view'>
            {filteredPrompts.map(prompt => (
              <View key={prompt.id} className='prompt-card'>
                <View className='prompt-header'>
                  <Text className='prompt-title'>{prompt.title}</Text>
                  <View 
                    onClick={() => toggleFavorite(prompt.id)}
                    className='favorite-btn'
                  >
                    <Text className={prompt.isFavorite ? 'favorite-active' : 'favorite'}>⭐</Text>
                  </View>
                </View>
                <Text className='prompt-content'>{prompt.content}</Text>
                <View className='prompt-tags'>
                  {prompt.tags.map((tag, index) => (
                    <View key={index} className='tag'>
                      <Text>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Button */}
      <View 
        className='add-btn'
        onClick={() => console.log('Add new prompt')}
      >
        <Text>+</Text>
      </View>
    </View>
  )
}

export default Index
