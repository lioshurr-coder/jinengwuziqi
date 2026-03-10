// Player management for Skill Gomoku

// Skill card definitions
const SKILLS = {
    FEI_SHA_ZOU_SHI: {
        id: 'fei_sha_zou_shi',
        name: '飞沙走石',
        description: '刮起一阵狂风，吹走棋盘上对手的随机一颗棋子',
        icon: '🌪️'
    },
    LI_BA_SHAN_XI: {
        id: 'li_ba_shan_xi',
        name: '力拔山兮',
        description: '摔碎当前的棋盘，换一张崭新的棋盘并重新开始游戏',
        icon: '🌊'
    },
    RENG_JIN_SHI_CHA_HAI: {
        id: 'reng_jin_shi_cha_hai',
        name: '扔进什刹海',
        description: '拿起对手的一颗棋子，大力扔进什刹海',
        icon: '🌊'
    },
    LIANG_JI_FAN_ZHUAN: {
        id: 'liang_ji_fan_zhuan',
        name: '两极反转',
        description: '你将跟对手在接下来的回合中交换棋子',
        icon: '🔄'
    },
    SHUI_DAO_QU_CHENG: {
        id: 'shui_dao_qu_cheng',
        name: '水到渠成',
        description: '引入什刹海的水进入棋盘，在任意方向形成一条水流，游戏双方在接下来的回合中都不可在此区域下棋',
        icon: '💧'
    },
    ZHI_KU_BAO_GAO: {
        id: 'zhi_ku_bao_gao',
        name: '无字天书',
        description: '令对手殚精竭虑，所有棋子原地爆炸',
        icon: '📖'
    },
    DA_YU_MAO_QIU: {
        id: 'da_yu_mao_qiu',
        name: '铩羽而归',
        description: '邀请对手打球，并让对手的一颗棋子变成羽毛球',
        icon: '🏸'
    }
};

// All skill IDs for random selection
const ALL_SKILL_IDS = Object.keys(SKILLS);

class Player {
    constructor(id, name, avatar, color) {
        this.id = id;
        this.name = name;
        this.avatar = avatar;
        this.color = color; // 'black' or 'white'
        this.skills = [];
        this.maxSkills = 5;
        this.initialSkillGiven = false;
    }
    
    // Add initial skill
    giveInitialSkill() {
        if (!this.initialSkillGiven) {
            this.addRandomSkill();
            this.initialSkillGiven = true;
        }
    }
    
    // Add a random skill card
    addRandomSkill() {
        if (this.skills.length >= this.maxSkills) {
            return false;
        }
        const skillId = randomElement(ALL_SKILL_IDS);
        this.skills.push(skillId);
        return true;
    }
    
    // Add specific skill
    addSkill(skillId) {
        if (this.skills.length >= this.maxSkills || !SKILLS[skillId]) {
            return false;
        }
        this.skills.push(skillId);
        return true;
    }
    
    // Remove skill at index
    removeSkill(index) {
        if (index >= 0 && index < this.skills.length) {
            return this.skills.splice(index, 1)[0];
        }
        return null;
    }
    
    // Use skill (remove from hand)
    useSkill(index) {
        if (index >= 0 && index < this.skills.length) {
            const skillId = this.skills[index];
            this.skills.splice(index, 1);
            return SKILLS[skillId];
        }
        return null;
    }
    
    // Get skill info at index
    getSkill(index) {
        if (index >= 0 && index < this.skills.length) {
            return SKILLS[this.skills[index]];
        }
        return null;
    }
    
    // Get all skills info
    getAllSkills() {
        return this.skills.map(id => SKILLS[id]);
    }
    
    // Check if player has skills
    hasSkills() {
        return this.skills.length > 0;
    }
    
    // Get skill count
    getSkillCount() {
        return this.skills.length;
    }
    
    // Check if can receive more skills
    canAddSkill() {
        return this.skills.length < this.maxSkills;
    }
    
    // Reset player for new game
    reset() {
        this.skills = [];
        this.initialSkillGiven = false;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Player, SKILLS, ALL_SKILL_IDS };
}
