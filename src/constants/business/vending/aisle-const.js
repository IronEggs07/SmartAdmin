// 货道状态枚举
export const AISLE_STATUS_ENUM = {
    NORMAL: {
        value: 1,
        desc: '正常销售',
    },
    FAULT: {
        value: 2,
        desc: '缺货',
    },
    OFFLINE: {
        value: 3,
        desc: '禁用/下架',
    },
    STOP: {
        value: 4,
        desc: '故障',
    },
};
export default {
    AISLE_STATUS_ENUM,
};