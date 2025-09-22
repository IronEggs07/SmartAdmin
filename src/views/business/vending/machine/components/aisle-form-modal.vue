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
                    placeholder="请搜索并选择商品" 
                    show-search 
                    allow-clear
                    :filter-option="false"
                    :show-arrow="false"
                    :not-found-content="goodsLoading ? '搜索中...' : '无匹配商品'"
                    :options="goodsOptions"
                    @search="handleGoodsSearch"
                    @change="handleGoodsChange"
                    :loading="goodsLoading"
                >
                    <template #suffixIcon>
                        <search-outlined v-if="!goodsLoading" />
                        <loading-outlined v-else />
                    </template>
                </a-select>
            </a-form-item>

            <!-- 库存 -->
            <a-form-item label="库存" name="stock">
                <a-input-number 
                    v-model:value="form.stock" 
                    :min="0" 
                    :max="form.capacity" 
                    :precision="0"
                    style="width: 100%" 
                    placeholder="请输入库存数量"
                />
            </a-form-item>

            <!-- 货道容量 (只读) -->
            <a-form-item label="货道容量" name="capacity">
                <a-input-number 
                    v-model:value="form.capacity" 
                    disabled 
                    style="width: 100%" 
                    :precision="0"
                />
            </a-form-item>

            <!-- 货道状态 -->
            <a-form-item label="状态" name="status">
                <a-radio-group v-model:value="form.status" button-style="solid">
                    <a-radio-button 
                        v-for="status in statusOptions" 
                        :key="status.value" 
                        :value="status.value"
                    >
                        {{ status.desc }}
                    </a-radio-button>
                </a-radio-group>
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
import { ref, reactive, watch, computed } from 'vue';
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
    capacity: 0,
    status: 1,
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
        // 验证表单
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

// 商品搜索处理
const handleGoodsSearch = _.debounce(async (query) => {
    if (!query || query.trim() === '') {
        goodsOptions.value = [];
        return;
    }
    try {
        goodsLoading.value = true;
        // 调用商品搜索API
        const res = await goodsApi.searchGoods({ keyword: query, pageSize: 50 });
        
        if (res && res.code === 0 && Array.isArray(res.data)) {
            // 格式化商品选项
            goodsOptions.value = res.data.map(item => ({
                label: item.goodsName || '未命名商品',
                value: item.goodsId,
                goodsCode: item.goodsCode,
                goodsName: item.goodsName
            }));
            
            // 如果当前商品ID在结果中，确保显示正确
            if (form.value.goodsId) {
                const currentGoods = goodsOptions.value.find(item => item.value === form.value.goodsId);
                if (!currentGoods) {
                    // 当前商品不在搜索结果中，添加到选项
                    goodsOptions.value.unshift({
                        label: `${form.value.goodsName || '未知商品'} (${form.value.goodsCode || '无编码'})`,
                        value: form.value.goodsId,
                        goodsCode: form.value.goodsCode,
                        goodsName: form.value.goodsName
                    });
                }
            }
        } else {
            goodsOptions.value = [];
            message.warning(res?.msg || '搜索商品失败');
        }
    } catch (error) {
        console.error('搜索商品失败:', error);
        message.error('搜索商品失败，请稍后重试');
        goodsOptions.value = [];
    } finally {
        goodsLoading.value = false;
    }
}, 500); // 500毫秒防抖

// 商品选择变化处理
const handleGoodsChange = (value, option) => {
    if (option) {
        form.value.goodsName = option.goodsName || '';
        form.value.goodsCode = option.goodsCode || '';
    } else {
        // 清空选择时
        form.value.goodsName = '';
        form.value.goodsCode = '';
    }
};

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
</style>