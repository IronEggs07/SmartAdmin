// 机器状态枚举
export const MACHINE_STATUS_ENUM = {
    NORMAL: {
        value: 1,
        desc: '正常',
    },
    FAULT: {
        value: 2,
        desc: '故障',
    },
    OFFLINE: {
        value: 3,
        desc: '离线',
    },
};
export default {
    MACHINE_STATUS_ENUM,
};
// // 添加机器图片上传地址
// export const GOODS_IMAGE_UPLOAD_URL = '/api/goods/upload-image';