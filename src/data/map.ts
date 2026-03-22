import type { Property } from '../types'

// 52 格大富翁地图 - 科技未来主题 (14×14 棋盘，外圈 52 格)
// 四个角: 起点(0), 宇航局(13), 监狱(26), 慈善基金会(39)
export const JAIL_POS = 26
export const GO_TO_JAIL_POS = 39
export const BOARD_SIZE = 14
export const TOTAL_CELLS = 52

export const MAP_DATA: Omit<Property, 'ownerId' | 'mortgage' | 'houses' | 'hotel'>[] = [
  // ==================== 底边 (右→左): 0-13 ====================
  { id: 0, name: '起点', type: 'corner', price: 0, rent: [], color: '', group: 0, description: '经过或到达起点获得 $200' },
  { id: 1, name: '无人零售店', type: 'property', price: 2200, rent: [70, 350, 1100, 2200, 3800, 6000], color: '#8B4513', group: 1, description: '24小时智能无人零售商店' },
  { id: 2, name: '米其林AI餐厅', type: 'property', price: 2400, rent: [80, 400, 1200, 2400, 4000, 6500], color: '#8B4513', group: 1, description: 'AI主厨掌勺的米其林餐厅' },
  { id: 3, name: '机会', type: 'chance', price: 0, rent: [], color: '', group: 0, description: '抽取一张机会卡' },
  { id: 4, name: '清华大学', type: 'property', price: 2600, rent: [90, 450, 1300, 2600, 4500, 7000], color: '#87CEEB', group: 2, description: '世界一流学府' },
  { id: 5, name: '机器人物流公司', type: 'property', price: 2600, rent: [90, 450, 1300, 2600, 4500, 7000], color: '#87CEEB', group: 2, description: '全自动化物流配送网络' },
  { id: 6, name: '芯片工厂', type: 'railroad', price: 2000, rent: [250, 500, 1000, 2000], color: '', group: 8, description: '尖端芯片制造工厂' },
  { id: 7, name: '无人车4S店', type: 'property', price: 2800, rent: [100, 500, 1500, 2800, 5000, 7500], color: '#FF69B4', group: 3, description: '自动驾驶汽车旗舰店' },
  { id: 8, name: '智能游乐园', type: 'property', price: 1600, rent: [50, 250, 800, 1600, 2700, 4300], color: '#FF69B4', group: 3, description: 'VR/AR沉浸式主题游乐园' },
  { id: 9, name: '命运卡', type: 'chest', price: 0, rent: [], color: '', group: 0, description: '抽取一张命运卡' },
  { id: 10, name: 'CV研究院', type: 'property', price: 1500, rent: [50, 250, 750, 1500, 2500, 4000], color: '#FFA500', group: 4, description: '计算机视觉前沿研究机构' },
  { id: 11, name: '无人酒店', type: 'property', price: 2000, rent: [60, 300, 1000, 2000, 3500, 5500], color: '#FFA500', group: 4, description: '全智能化无人酒店' },
  { id: 12, name: '诺亚动物园', type: 'property', price: 2300, rent: [80, 400, 1100, 2300, 3500, 5500], color: '#FFA500', group: 4, description: '基因科技动物保护基地' },
  { id: 13, name: '宇航局', type: 'corner', price: 0, rent: [], color: '', group: 0, description: '太空探索指挥中心 / 免费停留' },

  // ==================== 左边 (下→上): 14-25 ====================
  { id: 14, name: '智能社区', type: 'property', price: 600, rent: [20, 100, 300, 600, 1000, 1600], color: '#FF0000', group: 5, description: '智慧生活示范社区' },
  { id: 15, name: '记忆管理社', type: 'property', price: 2000, rent: [60, 300, 1000, 2000, 3500, 5500], color: '#FF0000', group: 5, description: '人脑记忆备份与管理服务' },
  { id: 16, name: '急救云医院', type: 'property', price: 3000, rent: [100, 500, 1500, 3000, 5000, 8000], color: '#FF0000', group: 5, description: '远程AI诊断急救医疗系统' },
  { id: 17, name: '垃圾处理站', type: 'utility', price: 2400, rent: [40, 100], color: '', group: 9, description: '智能垃圾分类与回收中心' },
  { id: 18, name: '机器人工厂', type: 'railroad', price: 2800, rent: [250, 500, 1000, 2000], color: '', group: 8, description: '工业机器人生产基地' },
  { id: 19, name: 'AI广告公司', type: 'property', price: 1600, rent: [50, 250, 800, 1600, 2700, 4300], color: '#FFFF00', group: 6, description: 'AI精准营销广告平台' },
  { id: 20, name: '穿戴设备店', type: 'property', price: 2000, rent: [60, 300, 1000, 2000, 3500, 5500], color: '#FFFF00', group: 6, description: '智能穿戴设备体验店' },
  { id: 21, name: 'NLP研究院', type: 'property', price: 2000, rent: [60, 300, 1000, 2000, 3500, 5500], color: '#FFFF00', group: 6, description: '自然语言处理顶级研究机构' },
  { id: 22, name: '自助时装店', type: 'property', price: 1200, rent: [40, 200, 600, 1200, 2000, 3200], color: '#008000', group: 7, description: 'AI量体裁衣自助时装店' },
  { id: 23, name: 'VR酒吧', type: 'property', price: 1400, rent: [50, 250, 700, 1400, 2300, 3800], color: '#008000', group: 7, description: '虚拟现实沉浸式酒吧' },
  { id: 24, name: '命运卡', type: 'chest', price: 0, rent: [], color: '', group: 0, description: '抽取一张命运卡' },
  { id: 25, name: '科技健身馆', type: 'property', price: 2400, rent: [80, 400, 1200, 2400, 4000, 6500], color: '#008000', group: 7, description: 'AI私教科技健身中心' },
  { id: 26, name: '监狱', type: 'corner', price: 0, rent: [], color: '', group: 0, description: '被关进监狱 / 只是路过' },

  // ==================== 顶边 (左→右): 27-39 ====================
  { id: 27, name: 'AI美容店', type: 'property', price: 2000, rent: [60, 300, 1000, 2000, 3500, 5500], color: '#0000CD', group: 10, description: 'AI个性化美妆造型店' },
  { id: 28, name: '经典剧院', type: 'property', price: 3000, rent: [100, 500, 1500, 3000, 5000, 8000], color: '#0000CD', group: 10, description: '全息投影经典剧院' },
  { id: 29, name: 'OCR研究院', type: 'property', price: 2000, rent: [60, 300, 1000, 2000, 3500, 5500], color: '#0000CD', group: 10, description: '光学字符识别研究中心' },
  { id: 30, name: '创意美术馆', type: 'property', price: 2400, rent: [80, 400, 1200, 2400, 4000, 6500], color: '#9400D3', group: 11, description: 'AI艺术创作展览馆' },
  { id: 31, name: '城市导航站', type: 'railroad', price: 3600, rent: [250, 500, 1000, 2000], color: '', group: 8, description: '全城智能交通导航枢纽' },
  { id: 32, name: '生态农场', type: 'property', price: 3000, rent: [100, 500, 1500, 3000, 5000, 8000], color: '#9400D3', group: 11, description: '智慧农业生态示范农场' },
  { id: 33, name: '无人车工厂', type: 'property', price: 2200, rent: [70, 350, 1100, 2200, 3800, 6000], color: '#9400D3', group: 11, description: '自动驾驶车辆生产线' },
  { id: 34, name: '宠物救助站', type: 'property', price: 2600, rent: [90, 450, 1300, 2600, 4500, 7000], color: '#FFD700', group: 12, description: 'AI宠物医疗救助中心' },
  { id: 35, name: '极客公园', type: 'utility', price: 1800, rent: [40, 100], color: '', group: 9, description: '科技爱好者极客乐园' },
  { id: 36, name: '机会卡', type: 'chance', price: 0, rent: [], color: '', group: 0, description: '抽取一张机会卡' },
  { id: 37, name: '体感图书馆', type: 'property', price: 2000, rent: [60, 300, 1000, 2000, 3500, 5500], color: '#FFD700', group: 12, description: '全感官沉浸式数字图书馆' },
  { id: 38, name: '身边闪送站', type: 'property', price: 1600, rent: [50, 250, 800, 1600, 2700, 4300], color: '#FFD700', group: 12, description: '无人机极速闪送站点' },
  { id: 39, name: '慈善基金会', type: 'corner', price: 0, rent: [], color: '', group: 0, description: '直接进入监狱！' },

  // ==================== 右边 (上→下): 40-51 ====================
  { id: 40, name: '共享停车场', type: 'property', price: 2200, rent: [70, 350, 1100, 2200, 3800, 6000], color: '#C0C0C0', group: 13, description: '智能共享停车管理系统' },
  { id: 41, name: '灵感咖啡店', type: 'property', price: 2400, rent: [80, 400, 1200, 2400, 4000, 6500], color: '#C0C0C0', group: 13, description: 'AI调酒师灵感咖啡吧' },
  { id: 42, name: 'SLAM研究院', type: 'property', price: 2400, rent: [80, 400, 1200, 2400, 4000, 6500], color: '#C0C0C0', group: 13, description: '即时定位与地图构建实验室' },
  { id: 43, name: 'AI家政公司', type: 'property', price: 1000, rent: [30, 150, 500, 1000, 1600, 2700], color: '#00CED1', group: 14, description: '智能家居家政服务平台' },
  { id: 44, name: '医药公司', type: 'property', price: 1600, rent: [50, 250, 800, 1600, 2700, 4300], color: '#00CED1', group: 14, description: 'AI辅助药物研发公司' },
  { id: 45, name: '硬件工厂', type: 'railroad', price: 2200, rent: [250, 500, 1000, 2000], color: '', group: 8, description: '智能硬件研发生产基地' },
  { id: 46, name: '机会卡', type: 'chance', price: 0, rent: [], color: '', group: 0, description: '抽取一张机会卡' },
  { id: 47, name: '智慧家居店', type: 'property', price: 2000, rent: [60, 300, 1000, 2000, 3500, 5500], color: '#FF6347', group: 15, description: '全屋智能体验旗舰店' },
  { id: 48, name: 'X研究院', type: 'property', price: 2200, rent: [70, 350, 1100, 2200, 3800, 6000], color: '#FF6347', group: 15, description: '神秘前沿科技研究机构' },
  { id: 49, name: '命运卡', type: 'chest', price: 0, rent: [], color: '', group: 0, description: '抽取一张命运卡' },
  { id: 50, name: '探索共享元', type: 'property', price: 2800, rent: [100, 500, 1500, 2800, 5000, 7500], color: '#E6E6FA', group: 16, description: '元宇宙共享经济平台' },
  { id: 51, name: '科幻度假村', type: 'property', price: 2600, rent: [90, 450, 1300, 2600, 4500, 7000], color: '#E6E6FA', group: 16, description: '太空主题科幻度假胜地' },
]

export function createInitialProperties(): Property[] {
  return MAP_DATA.map(p => ({
    ...p,
    ownerId: null,
    mortgage: false,
    houses: 0,
    hotel: false,
  }))
}
