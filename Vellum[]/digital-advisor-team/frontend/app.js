/**
 * 数字顾问笔记 - 私人笔记本风格
 * 参考：the-silent-notebook 交互设计
 */

// ========================================
// State Management
// ========================================
const state = {
    advisors: [],
    conversations: [],
    materials: [],
    currentAdvisor: null,
    currentConversation: null,
    selectedColor: '#2A6F7A',
    startTime: new Date(),
    companionTime: 0,
    sidebarCollapsed: false
};

const API_BASE_URL = 'http://localhost:8080';

// ========================================
// 初始化
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initCompanionTimer();
    initNavigation();
    initTabs();
    initUploadZone();
    initColorPicker();
    initTextarea();
    initModal();
    initCurrentDate();
    
    // 加载数据
    loadAdvisors();
});

// ========================================
// 侧边栏
// ========================================
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggle');
    
    if (!toggle) return;
    
    toggle.addEventListener('click', () => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
        sidebar.classList.toggle('collapsed', state.sidebarCollapsed);
    });
    
    // 检查屏幕宽度
    if (window.innerWidth <= 1024) {
        state.sidebarCollapsed = true;
        sidebar.classList.add('collapsed');
    }
    
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 1024) {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }
    });
}

// ========================================
// 时间陪伴器
// ========================================
function initCompanionTimer() {
    updateCompanionTime();
    setInterval(updateCompanionTime, 1000);
}

function updateCompanionTime() {
    const timerElement = document.getElementById('companionTime');
    if (!timerElement) return;
    
    state.companionTime = Math.floor((new Date() - state.startTime) / 1000);
    
    const mins = Math.floor(state.companionTime / 60);
    const secs = state.companionTime % 60;
    
    timerElement.textContent = `${mins}m ${secs}s`;
}

// ========================================
// 当前日期
// ========================================
function initCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (!dateElement) return;
    
    const now = new Date();
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('zh-CN', options);
}

// ========================================
// 导航
// ========================================
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 更新激活状态
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // 滚动到对应区域
            const targetId = item.getAttribute('href');
            scrollToSection(targetId.slice(1));
        });
    });
    
    // 滚动监听更新导航
    window.addEventListener('scroll', updateActiveNav);
}

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (!element) return;
    
    const offset = 32;
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    
    window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
    });
}

function updateActiveNav() {
    const sections = ['advisors', 'chat', 'knowledge'];
    const scrollPosition = window.pageYOffset + 100;
    
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        const navItem = document.querySelector(`.nav-item[href="#${sectionId}"]`);
        
        if (section && navItem) {
            const top = section.offsetTop;
            const bottom = top + section.offsetHeight;
            
            if (scrollPosition >= top && scrollPosition < bottom) {
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                navItem.classList.add('active');
            }
        }
    });
}

// ========================================
// 顾问管理
// ========================================
async function loadAdvisors() {
    try {
        const response = await fetch(`${API_BASE_URL}/knowledge/bloggers`);
        if (response.ok) {
            state.advisors = await response.json();
        } else {
            throw new Error('加载失败');
        }
    } catch (error) {
        console.log('使用示例数据');
        state.advisors = [
            { id: 1, name: '科技博主小王', description: '专注AI与前沿科技', color: '#2A6F7A' },
            { id: 2, name: '生活家小李', description: '分享生活方式与思考', color: '#8B6E4E' },
            { id: 3, name: '投资达人老张', description: '价值投资理念传播', color: '#6B7B8C' }
        ];
    }
    
    renderAdvisors();
}

function renderAdvisors() {
    const container = document.getElementById('advisorsList');
    if (!container) return;

    if (state.advisors.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>暂无顾问，点击添加</p></div>';
        return;
    }

    container.innerHTML = state.advisors.map(advisor => `
        <div class="advisor-card ${state.currentAdvisor?.id === advisor.id ? 'active' : ''}"
             style="--card-color: ${advisor.color || '#2A6F7A'}">
            <div class="advisor-card-main" onclick="selectAdvisor(${advisor.id})">
                <div class="advisor-avatar">
                    ${advisor.name.charAt(0)}
                </div>
                <div class="advisor-info">
                    <div class="advisor-name">${advisor.name}</div>
                    <div class="advisor-desc">${advisor.description || '暂无描述'}</div>
                </div>
            </div>
            <div class="advisor-card-actions">
                <button class="icon-btn advisor-edit-btn" onclick="editAdvisor(${advisor.id}, event)" title="编辑">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="icon-btn advisor-delete-btn" onclick="deleteAdvisor(${advisor.id}, event)" title="删除">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

async function editAdvisor(advisorId, event) {
    event.stopPropagation();
    const advisor = state.advisors.find(a => a.id === advisorId);
    if (!advisor) return;

    const newName = prompt('编辑顾问名称:', advisor.name);
    if (newName === null || newName.trim() === '') return;

    const newDesc = prompt('编辑顾问描述:', advisor.description || '');

    try {
        const response = await fetch(`${API_BASE_URL}/knowledge/bloggers/${advisorId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: newName.trim(),
                description: newDesc?.trim() || '',
                color: advisor.color // 添加 color 字段
            })
        });

        if (response.ok) {
            advisor.name = newName.trim();
            advisor.description = newDesc?.trim() || '';
            renderAdvisors();
            showToast('顾问已更新');
        } else {
            throw new Error('更新失败');
        }
    } catch (error) {
        advisor.name = newName.trim();
        advisor.description = newDesc?.trim() || '';
        renderAdvisors();
        showToast('顾问已更新（本地）');
    }
}

async function deleteAdvisor(advisorId, event) {
    event.stopPropagation();
    const advisor = state.advisors.find(a => a.id === advisorId);
    if (!advisor) return;

    if (!confirm(`确定要删除顾问 "${advisor.name}" 吗？\n\n这将同时删除该顾问的所有知识库材料和对话历史。`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/knowledge/bloggers/${advisorId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            state.advisors = state.advisors.filter(a => a.id !== advisorId);
            if (state.currentAdvisor?.id === advisorId) {
                state.currentAdvisor = null;
                state.materials = [];
                state.conversations = [];
                state.currentConversation = null;
                renderMaterials();
                renderConversations();
                renderMessages([]);
                updateKnowledgeSection();
            }
            renderAdvisors();
            showToast('顾问已删除');
        } else {
            throw new Error('删除失败');
        }
    } catch (error) {
        state.advisors = state.advisors.filter(a => a.id !== advisorId);
        if (state.currentAdvisor?.id === advisorId) {
            state.currentAdvisor = null;
            state.materials = [];
            state.conversations = [];
            state.currentConversation = null;
            renderMaterials();
            renderConversations();
            renderMessages([]);
            updateKnowledgeSection();
        }
        renderAdvisors();
        showToast('顾问已删除（本地）');
    }
}

function selectAdvisor(advisorId) {
    state.currentAdvisor = state.advisors.find(a => a.id === advisorId);
    renderAdvisors();

    // 更新对话副标题
    const subtitle = document.getElementById('chatSubtitle');
    if (subtitle && state.currentAdvisor) {
        subtitle.textContent = `与 ${state.currentAdvisor.name} 对话中`;
    }

    // 加载对话列表
    loadConversations();

    // 加载该顾问的知识库
    loadMaterials();

    // 更新知识库区域显示
    updateKnowledgeSection();

    showToast(`已选择 ${state.currentAdvisor?.name}`);

    // 移动端自动滚动到对话区
    if (window.innerWidth <= 1024) {
        scrollToSection('chat');
    }
}

function updateKnowledgeSection() {
    const knowledgeContent = document.getElementById('knowledgeContent');
    const knowledgeEmpty = document.getElementById('knowledgeEmpty');
    const knowledgeSubtitle = document.getElementById('knowledgeSubtitle');

    if (!knowledgeContent || !knowledgeEmpty) return;

    if (state.currentAdvisor) {
        knowledgeContent.style.display = 'block';
        knowledgeEmpty.style.display = 'none';
        if (knowledgeSubtitle) {
            knowledgeSubtitle.textContent = `${state.currentAdvisor.name} 的专属知识库`;
        }
    } else {
        knowledgeContent.style.display = 'none';
        knowledgeEmpty.style.display = 'flex';
        if (knowledgeSubtitle) {
            knowledgeSubtitle.textContent = '请先选择一位顾问';
        }
    }
}

// ========================================
// 弹窗
// ========================================
function initModal() {
    // ESC 关闭弹窗
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

function showAddAdvisorModal() {
    const modal = document.getElementById('addAdvisorModal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('advisorName')?.focus();
    }
}

function closeModal() {
    const modal = document.getElementById('addAdvisorModal');
    if (modal) {
        modal.classList.remove('active');
    }
    
    // 重置表单
    const nameInput = document.getElementById('advisorName');
    const descInput = document.getElementById('advisorDesc');
    if (nameInput) nameInput.value = '';
    if (descInput) descInput.value = '';
    
    // 重置颜色选择
    document.querySelectorAll('.color-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === 0);
    });
    state.selectedColor = '#2A6F7A';
}

function initColorPicker() {
    const colorDots = document.querySelectorAll('.color-dot');
    
    colorDots.forEach(dot => {
        dot.addEventListener('click', () => {
            colorDots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            state.selectedColor = dot.dataset.color;
        });
    });
}

async function addAdvisor() {
    const nameInput = document.getElementById('advisorName');
    const descInput = document.getElementById('advisorDesc');
    
    const name = nameInput?.value.trim();
    const description = descInput?.value.trim();
    
    if (!name) {
        showToast('请输入顾问名称', 'error');
        return;
    }
    
    const newAdvisor = {
        name,
        description,
        color: state.selectedColor
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/knowledge/bloggers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAdvisor)
        });
        
        if (response.ok) {
            const created = await response.json();
            state.advisors.push(created);
        } else {
            throw new Error('添加失败');
        }
    } catch (error) {
        // 本地模拟
        const mockAdvisor = {
            id: Date.now(),
            ...newAdvisor
        };
        state.advisors.push(mockAdvisor);
    }
    
    renderAdvisors();
    closeModal();
    showToast('顾问添加成功');
}

// ========================================
// 对话管理
// ========================================
async function loadConversations() {
    if (!state.currentAdvisor) {
        state.conversations = [];
        renderConversations();
        return;
    }
    
    try {
        const response = await fetch(
            `${API_BASE_URL}/conversation/bloggers/${state.currentAdvisor.id}/conversations`
        );
        if (response.ok) {
            state.conversations = await response.json();
        } else {
            throw new Error('加载失败');
        }
    } catch (error) {
        state.conversations = [];
    }
    
    renderConversations();
}

function renderConversations() {
    const container = document.getElementById('conversationList');
    if (!container) return;
    
    if (state.conversations.length === 0) {
        container.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--color-text-tertiary); font-size: 13px;">暂无对话</div>';
        return;
    }
    
    container.innerHTML = state.conversations.map(conv => `
        <div class="conversation-item ${state.currentConversation?.id === conv.id ? 'active' : ''}"
             onclick="selectConversation(${conv.id})">
            <div class="conversation-title">${conv.title || '未命名对话'}</div>
            <div class="conversation-time">${formatTime(conv.created_at)}</div>
        </div>
    `).join('');
}

function selectConversation(convId) {
    state.currentConversation = state.conversations.find(c => c.id === convId);
    renderConversations();
    loadMessages();
}

async function startNewChat() {
    console.log('startNewChat called, currentAdvisor:', state.currentAdvisor);
    if (!state.currentAdvisor) {
        showToast('请先选择一位顾问', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/conversation/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                blogger_id: state.currentAdvisor.id,
                title: '与 ' + state.currentAdvisor.name + ' 的对话'
            })
        });
        
        if (response.ok) {
            const newConv = await response.json();
            state.conversations.unshift(newConv);
            state.currentConversation = newConv;
            renderConversations();
            renderMessages([]);
        } else {
            throw new Error('创建失败');
        }
    } catch (error) {
        // 本地模拟
        const mockConv = {
            id: Date.now(),
            blogger_id: state.currentAdvisor.id,
            title: `与 ${state.currentAdvisor.name} 的对话`,
            created_at: new Date().toISOString()
        };
        state.conversations.unshift(mockConv);
        state.currentConversation = mockConv;
        renderConversations();
        renderMessages([]);
    }
}

async function loadMessages() {
    if (!state.currentConversation) return;
    
    try {
        const response = await fetch(
            `${API_BASE_URL}/conversation/conversations/${state.currentConversation.id}/messages`
        );
        if (response.ok) {
            const messages = await response.json();
            renderMessages(messages);
        } else {
            throw new Error('加载失败');
        }
    } catch (error) {
        renderMessages([]);
    }
}

function renderMessages(messages) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    if (!messages || messages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                </div>
                <p class="empty-title">开始一段对话</p>
                <p class="empty-desc">选择一位顾问，提出你的问题</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = messages.map(msg => `
        <div class="message ${msg.role}">
            <div class="message-avatar" style="${msg.role === 'advisor' ? `background: ${state.currentAdvisor?.color || '#2A6F7A'}; color: white;` : ''}">
                ${msg.role === 'advisor' ? state.currentAdvisor?.name.charAt(0) || 'A' : '我'}
            </div>
            <div class="message-content">${escapeHtml(msg.content)}</div>
        </div>
    `).join('');
    
    // 滚动到底部
    container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
    console.log('sendMessage called');
    const input = document.getElementById('messageInput');
    const content = input?.value.trim();
    
    console.log('content:', content, 'currentAdvisor:', state.currentAdvisor);
    
    if (!content) return;
    if (!state.currentAdvisor) {
        showToast('请先选择一位顾问', 'error');
        return;
    }
    
    // 清空输入框
    if (input) input.value = '';
    adjustTextareaHeight(input);
    
    // 如果没有当前对话，先创建一个
    if (!state.currentConversation) {
        await startNewChat();
    }
    
    const container = document.getElementById('chatMessages');
    
    // 添加用户消息
    if (container) {
        // 移除空状态
        const emptyState = container.querySelector('.empty-state');
        if (emptyState) {
            container.innerHTML = '';
        }
        
        const userDiv = document.createElement('div');
        userDiv.className = 'message user';
        userDiv.innerHTML = `
            <div class="message-avatar">我</div>
            <div class="message-content">${escapeHtml(content)}</div>
        `;
        container.appendChild(userDiv);
        container.scrollTop = container.scrollHeight;
    }
    
    try {
        // 发送消息
        await fetch(
            `${API_BASE_URL}/conversation/conversations/${state.currentConversation.id}/messages`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'user', content: content })
            }
        );
        
        // 获取 AI 回复
        const chatResponse = await fetch(
            `${API_BASE_URL}/conversation/conversations/${state.currentConversation.id}/chat`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_message: content, style_description: "" }) // 暂时发送空字符串
            }
        );
        
        if (chatResponse.ok && container) {
            const data = await chatResponse.json();
            
            // 显示思考过程（可折叠）
            let thoughtHtml = '';
            if (data.thought) {
                thoughtHtml = `
                    <div class="agent-thought" style="margin-bottom: 8px; padding: 8px 12px; background: rgba(42, 111, 122, 0.1); border-radius: 8px; font-size: 12px; color: var(--color-text-secondary);">
                        <div style="font-weight: 600; margin-bottom: 4px;">💭 思考过程</div>
                        <div>${escapeHtml(data.thought)}</div>
                        ${data.action ? `<div style="margin-top: 4px; color: var(--color-primary);">行动: ${escapeHtml(data.action)}</div>` : ''}
                    </div>
                `;
            }
            
            const advisorDiv = document.createElement('div');
            advisorDiv.className = 'message advisor';
            advisorDiv.innerHTML = `
                <div class="message-avatar" style="background: ${state.currentAdvisor?.color || '#2A6F7A'}; color: white;">
                    ${state.currentAdvisor?.name.charAt(0) || 'A'}
                </div>
                <div class="message-content">
                    ${thoughtHtml}
                    <div>${escapeHtml(data.response)}</div>
                </div>
            `;
            container.appendChild(advisorDiv);
            container.scrollTop = container.scrollHeight;
        }
    } catch (error) {
        console.error('发送失败:', error);
        
        // 模拟回复
        setTimeout(() => {
            if (container) {
                const advisorDiv = document.createElement('div');
                advisorDiv.className = 'message advisor';
                advisorDiv.innerHTML = `
                    <div class="message-avatar" style="background: ${state.currentAdvisor?.color || '#2A6F7A'}; color: white;">
                        ${state.currentAdvisor?.name.charAt(0) || 'A'}
                    </div>
                    <div class="message-content">这是一个模拟回复。在实际运行中，这里会显示AI生成的回复内容。</div>
                `;
                container.appendChild(advisorDiv);
                container.scrollTop = container.scrollHeight;
            }
        }, 1000);
    }
}

// ========================================
// 知识库标签
// ========================================
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            // 更新按钮状态
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 更新内容
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tab}Tab`)?.classList.add('active');
        });
    });
}

// ========================================
// 上传区
// ========================================
function initUploadZone() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    
    if (!uploadZone || !fileInput) return;
    
    uploadZone.addEventListener('click', () => fileInput.click());
    
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--color-primary)';
        uploadZone.style.background = 'var(--color-primary-muted)';
    });
    
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.style.borderColor = '';
        uploadZone.style.background = '';
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '';
        uploadZone.style.background = '';
        
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    });
    
    fileInput.addEventListener('change', (e) => {
        handleFiles(Array.from(e.target.files));
    });
}

async function handleFiles(files) {
    if (!state.currentAdvisor) {
        showToast('请先选择一位顾问', 'error');
        return;
    }
    
    for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('blogger_id', state.currentAdvisor.id);
        formData.append('title', file.name); // 使用文件名作为标题
        formData.append('material_type', 'OTHER'); // 默认类型为 OTHER
        
        try {
            const response = await fetch(`${API_BASE_URL}/knowledge/materials`, {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                showToast(`已上传: ${file.name}`);
            } else {
                throw new Error('上传失败');
            }
        } catch (error) {
            showToast(`上传失败: ${file.name}`, 'error');
        }
    }
    
    loadMaterials();
}

async function loadMaterials() {
    if (!state.currentAdvisor) {
        state.materials = [];
        renderMaterials();
        return;
    }
    
    try {
        const response = await fetch(
            `${API_BASE_URL}/knowledge/bloggers/${state.currentAdvisor.id}/materials`
        );
        if (response.ok) {
            state.materials = await response.json();
        } else {
            throw new Error('加载失败');
        }
    } catch (error) {
        state.materials = [];
    }
    
    renderMaterials();
}

function renderMaterials() {
    const container = document.getElementById('materialsList');
    if (!container) return;

    if (state.materials.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding: 32px 0;"><p style="color: var(--color-text-tertiary); font-size: 13px;">暂无材料，请上传或采集</p></div>';
        return;
    }

    container.innerHTML = state.materials.map(material => {
        const icon = getFileIcon(material.file_type);
        return `
            <div class="material-item" data-material-id="${material.id}">
                <div class="material-icon">${icon}</div>
                <div class="material-info">
                    <div class="material-name">${material.title}</div>
                    <div class="material-meta">${formatFileSize(material.file_size)} · ${formatTime(material.created_at)}</div>
                </div>
                <div class="material-actions">
                    <button class="icon-btn material-edit-btn" onclick="editMaterial(${material.id})" title="编辑">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="icon-btn material-delete-btn" onclick="deleteMaterial(${material.id})" title="删除">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function editMaterial(materialId) {
    const material = state.materials.find(m => m.id === materialId);
    if (!material) return;

    const newTitle = prompt('编辑材料名称:', material.title);
    if (newTitle === null || newTitle.trim() === '') return;

    try {
        const response = await fetch(`${API_BASE_URL}/knowledge/materials/${materialId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle.trim() })
        });

        if (response.ok) {
            material.title = newTitle.trim();
            renderMaterials();
            showToast('材料已更新');
        } else {
            throw new Error('更新失败');
        }
    } catch (error) {
        // 本地更新
        material.title = newTitle.trim();
        renderMaterials();
        showToast('材料已更新（本地）');
    }
}

async function deleteMaterial(materialId) {
    const material = state.materials.find(m => m.id === materialId);
    if (!material) return;

    if (!confirm(`确定要删除 "${material.title}" 吗？`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/knowledge/materials/${materialId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            state.materials = state.materials.filter(m => m.id !== materialId);
            renderMaterials();
            showToast('材料已删除');
        } else {
            throw new Error('删除失败');
        }
    } catch (error) {
        // 本地删除
        state.materials = state.materials.filter(m => m.id !== materialId);
        renderMaterials();
        showToast('材料已删除（本地）');
    }
}

function getFileIcon(type) {
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('text')) return '📝';
    if (type?.includes('markdown')) return '📑';
    return '📎';
}

function formatFileSize(bytes) {
    if (!bytes) return '未知大小';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
}

// ========================================
// 爬虫
// ========================================
async function startCrawling() {
    const urlInput = document.getElementById('crawlerUrl');
    const url = urlInput?.value.trim();
    
    if (!url) {
        showToast('请输入网址', 'error');
        return;
    }
    if (!state.currentAdvisor) {
        showToast('请先选择一位顾问', 'error');
        return;
    }
    
    const mode = document.querySelector('input[name="crawlerMode"]:checked')?.value || 'single';
    
    showToast('开始采集...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/crawler/crawl`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url,
                mode,
                blogger_id: state.currentAdvisor.id
            })
        });
        
        if (response.ok) {
            showToast('采集完成');
            urlInput.value = '';
            loadMaterials();
        } else {
            throw new Error('采集失败');
        }
    } catch (error) {
        showToast('采集失败，请检查网址', 'error');
    }
}

// ========================================
// 文本域自动高度
// ========================================
function initTextarea() {
    const textarea = document.getElementById('messageInput');
    if (!textarea) return;
    
    textarea.addEventListener('input', () => adjustTextareaHeight(textarea));
    
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

function adjustTextareaHeight(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

// ========================================
// 工具函数
// ========================================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = 'toast show';
    
    if (type === 'error') {
        toast.style.borderColor = '#ef4444';
    } else {
        toast.style.borderColor = '';
    }
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return date.toLocaleDateString('zh-CN');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
