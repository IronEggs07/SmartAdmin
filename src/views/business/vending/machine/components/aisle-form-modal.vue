<template>
    <a-drawer 
        :title="title" 
        :width="500" 
        :visible="visible" 
        :body-style="{ paddingBottom: '80px' }" 
        @close="onClose"
        :maskClosable="true"
        :keyboard="true"
    >
        <!-- aisle-form-modal.vue -->
        <a-form :model="form" :rules="rules" ref="formRef" layout="vertical">
            <!-- 货道编号 (只读) -->
            <a-form-item label="货道编号" name="aisleCode">
                <a-input v-model:value="form.aisleCode" placeholder="货道编号" disabled />
            </a-form-item>

            <!-- 关联商品 -->
            <a-form-item label="关联商品" name="goodsId">
                <a-select
                    v-model:value="form.goodsId"
                    show-search
                    allow-clear
                    placeholder="请输入商品名称/编码搜索"
                    :filter-option="false"
                    :not-found-content="goodsLoading ? '搜索中...' : (searchQuery ? '无匹配商品' : '请输入商品名称/编码搜索')"
                    :options="goodsOptions"
                    :loading="goodsLoading"
                    @search="handleGoodsSearch"
                    @change="handleGoodsChange"
                    @popupScroll="handleScroll"
                    @dropdownVisibleChange="handleDropdownVisible"
                    class="goods-selector"
                >
                    <template #suffixIcon>
                        <search-outlined v-if="!goodsLoading" />
                        <loading-outlined v-else />
                    </template>
                    <template #option="{ label, goodsCode }">
                        <div class="goods-option">
                            <div class="goods-name">{{ label }}</div>
                            <div class="goods-code">{{ goodsCode || '无编码' }}</div>
                        </div>
                    </template>
                </a-select>
            </a-form-item>

            <!-- 库存 -->
            <a-form-item label="货道剩余" name="stock">
                <div style="display: flex; gap: 8px;">
                    <a-input-number 
                        v-model:value="form.stock" 
                        :min="0" 
                        :max="form.capacity" 
                        :precision="0"
                        style="flex: 1" 
                        placeholder="请输入货道剩余数量"
                        @change="updateStatus"
                    />
                    <a-button type="primary" @click="handleRestock" :disabled="form.stock >= form.capacity">
                        一键补货
                    </a-button>
                </div>
            </a-form-item>

            <!-- 货道容量 (只读) -->
            <a-form-item label="货道容量" name="capacity">
                <a-input-number 
                    v-model:value="form.capacity" 
                    disabled 
                    style="width: 100%" 
                    :precision="0" 
                    :min="1"
                />
            </a-form-item>

            <!-- 货道状态 (只读) -->
            <a-form-item label="状态" name="status">
                <a-tag :color="getStatusColor(form.status)" style="font-size: 14px; padding: 4px 12px;">
                    {{ getStatusDesc(form.status) }}
                </a-tag>
                <template #help>
                    <div style="font-size: 12px; color: #999; margin-top: 4px;">
                        状态说明：
                        <ul style="margin: 4px 0 0 16px; padding: 0;">
                            <li>正常销售：货道正常运营中</li>
                            <li>缺货：货道剩余 ≤ 1</li>
                            <li>禁用/下架：管理员手动设置</li>
                            <li>故障：管理员手动设置</li>
                        </ul>
                    </div>
                </template>
            </a-form-item>
        </a-form>


        <div :style="{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: '100%',
            borderTop: '1px solid #e9e9e9',
            padding: '10px 16px',
            background: '#fff',
            textAlign: 'right',
            zIndex: 1,
        }">
            <a-button style="margin-right: 8px" @click="onClose">取消</a-button>
            <a-button type="primary" @click="handleSubmit" :loading="loading">确定</a-button>
        </div>
    </a-drawer>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue';
import { SmartLoading } from '/@/components/framework/smart-loading';
import { message } from 'ant-design-vue';
import { SearchOutlined, LoadingOutlined } from '@ant-design/icons-vue';
import { machineApi } from '/@/api/business/vending/machine-api';
import { AISLE_STATUS_ENUM } from '/@/constants/business/vending/aisle-const';
import _ from 'lodash';
import { goodsApi } from '/@/api/business/goods/goods-api';
import { machineAisleApi } from '/@/api/business/vending/aisle-api';


const props = defineProps({
    machineId: {
        type: Number,
        required: true
    },
    currentRecord: {
        type: Object,
        default: () => ({})
    },
    visible: Boolean, // 使用 v-model:visible 控制显隐
});

const title = computed(() => (props.currentRecord && props.currentRecord.aisleId ? '编辑货道' : '新建货道'));

const emit = defineEmits(['update:visible', 'success']);

const statusOptions = computed(() => Object.values(AISLE_STATUS_ENUM));

// 表单引用
const formRef = ref();
// 加载状态
const loading = ref(false);
// 用户选项
const userOptions = ref([]);
// 用户加载状态
const userLoading = ref(false);

const goodsOptions = ref([]); // 存储搜索结果选项
const goodsLoading = ref(false); // 控制选择器的加载状态

// 表单数据
const form = ref({
    aisleId: '',
    machineId: props.machineId,
    aisleCode: '',
    goodsId: '',
    goodsName: '',  // 新增商品名字段
    stock: 0,
    capacity: 10,   // 默认货道容量为10
    status: AISLE_STATUS_ENUM.NORMAL.value, // 默认正常状态
    createTime: '',  // 新增创建时间字段
    updateTime: ''   // 新增更新时间字段
});

// 表单验证规则
const rules = {
    aisleCode: [
        { required: true, message: '货道编号不能为空', trigger: 'blur' }
    ],
    goodsName: [
        { required: true, message: '请选择商品', trigger: 'change' }
    ],
    stock: [
        { required: true, message: '请输入库存数量', trigger: 'blur' },
        {
            validator: (rule, value) => {
                if (value > form.value.capacity) {
                    return Promise.reject('库存不能大于货道容量');
                }
                if (value < 0) {
                    return Promise.reject('库存不能为负数');
                }
                return Promise.resolve();
            }, 
            trigger: 'blur'
        }
    ],
    capacity: [
        { required: true, message: '货道容量不能为空', trigger: 'blur' }
    ],
    status: [
        { required: true, message: '请选择货道状态', trigger: 'change' }
    ]
};

// 关闭弹窗
function onClose() {
    if (loading.value) return; // 如果正在提交，禁止关闭
    emit('update:visible', false);
    // 重置表单
    formRef.value?.resetFields();
}

// 提交表单
async function handleSubmit() {
    try {
        await formRef.value.validate();
        
        // 显示加载状态
        loading.value = true;
        SmartLoading.show('提交中...');

        // 准备提交数据
        const submitData = {
            ...form.value,
            // 确保数值类型正确
            stock: Number(form.value.stock),
            capacity: Number(form.value.capacity),
            status: Number(form.value.status)
        };

        // 调用 API
        const response = await machineAisleApi.updateMachineAisle(submitData);
        
        if (response && response.code === 0) {
            // 提交成功
            message.success(form.value.aisleId ? '更新货道成功' : '创建货道成功');
            emit('success'); // 通知父组件刷新数据
            onClose(); // 关闭弹窗
        } else {
            // 接口返回错误
            const errorMsg = response?.msg || '操作失败，请稍后重试';
            message.error(errorMsg);
            // 可以在这里处理特定错误码
            if (response?.code === 1001) { // 示例：处理特定错误码
                // 特定错误处理逻辑
            }
        }
    } catch (error) {
        console.error('提交表单出错:', error);
        // 处理网络错误或验证错误
        if (error.name === 'AxiosError') {
            message.error('网络错误，请检查您的网络连接');
        } else if (error.errorFields) {
            // 表单验证错误
            message.warning('请检查表单填写是否正确');
        } else {
            message.error(error.message || '操作失败，请稍后重试');
        }
    } finally {
        // 无论成功失败，都关闭加载状态
        loading.value = false;
        SmartLoading.hide();
    }
}

// 商品分页参数
const goodsPagination = reactive({
    current: 1,
    pageSize: 7, // 默认每页7条
    total: 0,
    hasMore: true
});

// 搜索关键词
const searchQuery = ref('');
// 是否正在加载更多
const loadingMore = ref(false);

// 加载商品详情（编辑模式使用）
async function loadGoodsDetail(goodsId) {
    try {
        const res = await goodsApi.getGoodsDetail(goodsId);
        if (res?.code === 0 && res.data) {
            const goods = res.data;
            goodsOptions.value = [{
                label: goods.goodsName,
                value: goods.goodsId,
                goodsCode: goods.goodsCode,
                goodsName: goods.goodsName
            }];
        }
    } catch (error) {
        console.error('加载商品详情失败:', error);
    }
}

// 商品搜索处理
const handleGoodsSearch = _.debounce(async (query, reset = true) => {
    // 如果是新搜索，重置分页
    if (reset) {
        goodsPagination.current = 1;
        goodsPagination.hasMore = true;
        goodsOptions.value = [];
    }
    
    // 如果没有搜索词，清空结果
    if (!query?.trim()) {
        searchQuery.value = '';
        goodsOptions.value = [];
        return;
    }
    
    searchQuery.value = query;
    goodsLoading.value = true;
    
    try {
        const res = await goodsApi.queryGoodsList({
            keyword: query,
            pageNum: goodsPagination.current,
            pageSize: goodsPagination.pageSize,
            status: 1 // 只查询上架商品
        });
        
        if (res?.code === 0) {
            const { list = [], total = 0 } = res.data || {};
            
            // 格式化商品选项
            const newOptions = list.map(item => ({
                label: item.goodsName || '未命名商品',
                value: item.goodsId,
                goodsCode: item.goodsCode,
                goodsName: item.goodsName
            }));
            
            if (reset) {
                goodsOptions.value = newOptions;
            } else {
                goodsOptions.value = [...goodsOptions.value, ...newOptions];
            }
            
            // 更新分页信息
            goodsPagination.total = total;
            goodsPagination.hasMore = goodsOptions.value.length < total;
            
            // 编辑模式下，确保当前商品在选项中
            if (form.value.goodsId && !goodsOptions.value.some(item => item.value === form.value.goodsId)) {
                await loadGoodsDetail(form.value.goodsId);
            }
        } else {
            message.warning(res?.msg || '搜索商品失败');
            if (reset) goodsOptions.value = [];
        }
    } catch (error) {
        console.error('搜索商品失败:', error);
        message.error('搜索商品失败，请稍后重试');
        if (reset) goodsOptions.value = [];
    } finally {
        goodsLoading.value = false;
        loadingMore.value = false;
    }
}, 300);

// 滚动加载更多
function handleScroll(e) {
    if (goodsLoading.value || loadingMore.value || !goodsPagination.hasMore) {
        return;
    }
    
    const { target } = e;
    // 滚动到底部时加载更多
    if (target.scrollTop + target.offsetHeight >= target.scrollHeight - 20) {
        loadMore();
    }
}

// 加载更多
async function loadMore() {
    if (!goodsPagination.hasMore || goodsLoading.value || loadingMore.value) {
        return;
    }
    
    loadingMore.value = true;
    goodsPagination.current += 1;
    await handleGoodsSearch(searchQuery.value, false);
}

// 下拉框显示/隐藏处理
function handleDropdownVisible(open) {
    if (open && searchQuery.value && goodsOptions.value.length === 0) {
        // 下拉框打开时，如果有搜索词但无结果，重新搜索
        handleGoodsSearch(searchQuery.value);
    } else if (!open) {
        // 下拉框关闭时，保留搜索词但清空选项
        goodsOptions.value = [];
    }
}

// 商品选择变化处理
const handleGoodsChange = (value, option) => {
    if (value) {
        const selectedGoods = goodsOptions.value.find(item => item.value === value) || option;
        if (selectedGoods) {
            form.value.goodsName = selectedGoods.goodsName || selectedGoods.label;
            form.value.goodsCode = selectedGoods.goodsCode;
        }
    } else {
        form.value.goodsName = '';
        form.value.goodsCode = '';
    }
};

// 一键补货
const handleRestock = () => {
    form.value.stock = form.value.capacity;
    updateStatus();
};

// 更新状态
const updateStatus = () => {
    if (form.value.stock <= 1) {
        form.value.status = AISLE_STATUS_ENUM.FAULT.value; // 缺货状态
    } else {
        form.value.status = AISLE_STATUS_ENUM.NORMAL.value; // 正常状态
    }
};

// 获取状态描述
const getStatusDesc = (status) => {
    const statusObj = statusOptions.value.find(item => item.value === status);
    return statusObj ? statusObj.desc : `未知状态(${status})`;
};

// 获取状态对应的颜色
const getStatusColor = (status) => {
    switch (status) {
        case AISLE_STATUS_ENUM.NORMAL.value:
            return 'green';
        case AISLE_STATUS_ENUM.FAULT.value:
            return 'orange';
        case AISLE_STATUS_ENUM.OFFLINE.value:
            return 'red';
        case AISLE_STATUS_ENUM.STOP.value:
            return 'volcano';
        default:
            return 'default';
    }
};

// 加载商品列表
const loadGoodsList = async () => {
    try {
        goodsLoading.value = true;
        const response = await goodsApi.getGoodsList({ pageSize: 1000 });
        if (response && response.code === 0 && response.data && Array.isArray(response.data.records)) {
            goodsOptions.value = response.data.records.map(item => ({
                value: item.goodsId,
                label: item.goodsName,
                ...item
            }));
        }
    } catch (error) {
        console.error('加载商品列表失败:', error);
    } finally {
        goodsLoading.value = false;
    }
};

// 组件挂载时初始化
onMounted(() => {
    // 编辑模式下，加载当前商品信息
    if (props.currentRecord?.goodsId) {
        loadGoodsDetail(props.currentRecord.goodsId);
    }
    
    // 初始化时设置默认容量为10
    if (!form.value.aisleId) {
        form.value.capacity = 10;
        form.value.status = AISLE_STATUS_ENUM.NORMAL.value;
    }
});

watch(
    () => props.currentRecord,
    (newRecord) => {
        if (newRecord && newRecord.aisleId) {
            // 编辑模式：用新传入的数据填充表单
            form.value = { ...newRecord };
        } else {
            // 新建/或关闭后的重置模式
            formRef.value?.resetFields();
            form.value = {
                aisleId: '',
                machineId: props.machineId,
                aisleCode: '',
                goodsId: '',
                goodsName: '',
                stock: 0,
                capacity: 0,
                status: 1,
                createTime: '',
                updateTime: ''
            };
        }
    },
    { deep: true, immediate: true }
);
</script>

<style scoped>
:deep(.ant-form-item) {
    margin-bottom: 16px;
}

:deep(.ant-radio-button-wrapper) {
    padding: 0 15px;
    text-align: center;
    min-width: 80px;
}

/* 表单标签样式 */
:deep(.ant-form-item-label > label) {
    font-weight: 500;
}

/* 数字输入框样式 */
:deep(.ant-input-number) {
    width: 100%;
}

/* 商品选项样式 */
.goods-option {
    display: flex;
    flex-direction: column;
    line-height: 1.4;
    padding: 6px 0;
    
    .goods-name {
        font-weight: 500;
        margin-bottom: 2px;
        color: #333;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .goods-code {
        font-size: 12px;
        color: #999;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
}

/* 加载更多提示 */
.loading-more {
    text-align: center;
    color: #999;
    font-size: 12px;
    padding: 6px 0;
    background: #fafafa;
    border-top: 1px solid #f0f0f0;
}

/* 空状态 */
.empty-state {
    padding: 12px 0;
    text-align: center;
    color: #999;
    font-size: 13px;
}
</style>

<style>
/* 全局样式，覆盖Ant Design默认样式 */
.goods-selector .ant-select-item {
    padding: 8px 12px;
    transition: background-color 0.3s;
}

.goods-selector .ant-select-item-option-active {
    background-color: #f5f5f5;
}

.goods-selector .ant-select-dropdown-menu {
    max-height: 280px;
    overflow-y: auto;
    padding: 4px 0;
    
    &::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }
    
    &::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
    }
    
    &::-webkit-scrollbar-track {
        background: transparent;
    }
}

/* 下拉框搜索框样式 */
.goods-selector .ant-select-selection-search-input {
    height: 32px;
}

/* 下拉框加载状态 */
.goods-selector .ant-select-dropdown-loading {
    padding: 8px 0;
}
</style>