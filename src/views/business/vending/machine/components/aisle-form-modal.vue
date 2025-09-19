<template>
    <a-drawer :title="title" :width="500" :visible="visible" :body-style="{ paddingBottom: '80px' }" @close="onClose"
        :maskClosable="false">
        <!-- aisle-form-modal.vue -->
        <a-form :model="form" :rules="rules" ref="formRef" layout="vertical">
            <!-- 货道编号 (通常由后端生成或根据型号确定，设为只读) -->
            <a-form-item label="货道编号" name="aisle_code">
                <a-input v-model:value="form.aisleCode" placeholder="请输入货道编号" disabled />
            </a-form-item>

            <!-- 关联商品 -->
            <a-form-item label="关联商品" name="goodsId">
                <!-- 实际项目中，这里应该是一个支持远程搜索的商品选择器 -->
                <a-select v-model:value="form.goodsId" placeholder="请搜索并选择商品" show-search allow-clear
                    :filter-option="false" @search="handleGoodsSearch">
                    <!-- options 应该由搜索结果动态填充 -->
                </a-select>
            </a-form-item>

            <!-- 当前库存 -->
            <a-form-item label="当前库存" name="stock">
                <a-input-number v-model:value="form.stock" :min="0" :max="form.capacity" style="width: 100%" />
            </a-form-item>

            <!-- 货道容量 (通常由机器型号决定，设为只读) -->
            <a-form-item label="货道容量" name="capacity">
                <a-input-number v-model:value="form.capacity" disabled style="width: 100%" />
            </a-form-item>

            <!-- 货道状态 -->
            <a-form-item label="货道状态" name="status">
                <a-radio-group v-model:value="form.status">
                    <!-- 使用 v-for 动态渲染所有状态选项 -->
                    <a-radio v-for="status in statusOptions" :key="status.value" :value="status.value">
                        {{ status.desc }}
                    </a-radio>
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
import { machineApi } from '/@/api/business/vending/machine-api';
import { AISLE_STATUS_ENUM } from '/@/constants/business/vending/aisle-const';
// import { useMachineStore } from '/@/store/modules/business/vending/vending-store';


// const machineStore = useMachineStore();


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

// 表单数据
const form = ref({
    aisleId: '',
    machineId: props.machineId,
    aisleCode: '',
    goodsId: '',
    stock: 0,
    capacity: 0,
    status: 1
});

// 表单验证规则
// aisle-form-modal.vue -> <script setup>
const rules = {
    goodsId: [
        { required: true, message: '请选择关联的商品', trigger: 'change' },
    ],
    stock: [
        { required: true, message: '请输入当前库存', trigger: 'blur' },
        // 自定义校验：库存不能大于容量
        {
            validator: (rule, value) => {
                if (value > form.value.capacity) {
                    return Promise.reject('库存不能大于货道容量');
                }
                return Promise.resolve();
            }, trigger: 'blur'
        },
    ],
    status: [
        { required: true, message: '请选择货道状态', trigger: 'change' },
    ],
};



// 关闭弹窗
function onClose() {
    emit('update:visible', false);
}

// 提交表单
async function handleSubmit() {
    try {
        await formRef.value.validate();
        loading.value = true;
        SmartLoading.show();

        // 直接调用 API，而不是 store action
        await machineApi.updateAisle(form.value);

        message.success('更新成功'); // 手动添加成功提示

        onClose();
        emit('success');

    } catch (error) {
        // ... 错误处理 ...
    } finally {
        loading.value = false;
        SmartLoading.hide();
    }
}

watch(
    () => props.currentRecord,
    (newRecord) => {
        if (newRecord && newRecord.aisleId) {
            // 编辑模式：用新传入的数据填充表单
            // 使用 Object.assign 保留响应性，并确保 form.value 的引用不变
            Object.assign(form.value, newRecord);
        } else {
            // 新建/或关闭后的重置模式
            formRef.value?.resetFields(); // 清除校验状态和部分字段
            // 手动重置所有字段为初始状态
            form.value = {
                aisleId: '',
                machineId: props.machineId, // 继承 machineId
                aisleCode: '',
                goodsId: '',
                stock: 0,
                capacity: 0, // 容量也应被重置或重新获取
                status: 1
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
</style>