<template>
    <div class="aisle-table-wrapper">
        <a-table :columns="columns" :data-source="aisleList" :loading="localLoading" rowKey="aisleId"
            :pagination="false">
            <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'action'">
                    <a @click="handleEdit(record)">编辑</a>
                </template>
            </template>
        </a-table>
        <AisleFormModal v-model:visible="modalVisible" :machineId="props.machineId" :current-record="currentRecord"
            @success="handleSuccess" />
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import AisleFormModal from './aisle-form-modal.vue';
import { machineApi } from '/@/api/business/vending/machine-api';
import { machineAisleApi } from '/@/api/business/vending/aisle-api';
//   import { useMachineStore } from '@/stores/machine';
// import { storeToRefs } from 'pinia';

const props = defineProps({
    machineId: {
        type: Number,
        required: true
    }
});

// 导入状态常量
import { AISLE_STATUS_ENUM } from '/@/constants/business/vending/aisle-const';

// 创建状态映射
const statusMap = Object.values(AISLE_STATUS_ENUM).reduce((map, item) => {
    map[item.value] = item.desc;
    return map;
}, {});

const columns = ref([
    {
        title: '货道编号',
        dataIndex: 'aisleCode',
        width: 100,
    },
    {
        title: '商品名称',
        dataIndex: 'goodsName',
        width: 150,
        ellipsis: true
    },
    {
        title: '库存',
        dataIndex: 'stock',
        width: 100,
    },
    {
        title: '货道容量',
        dataIndex: 'capacity',
        width: 100,
    },
    {
        title: '状态',
        dataIndex: 'status',
        width: 100,
        customRender: ({ text }) => statusMap[text] || `未知状态(${text})`,
    },
    {
        title: '操作',
        dataIndex: 'action',
        width: 80,
    },
    {
        title: '创建时间',
        dataIndex: 'createTime',
        width: 170,
        align: 'center',
        sorter: true,
        defaultSortOrder: 'descend',
        required: true,
    },
    {
        title: '更新时间',
        dataIndex: 'updateTime',
        width: 170,
        align: 'center',
        sorter: true,
        required: true,
    },
]);



const localLoading = ref(false);

const modalVisible = ref(false);

const currentRecord = ref(null);


const aisleList = ref([]);
// 加载货道数据
const loadAisles = async () => {
    if (!props.machineId) {
        console.warn('machineId 为空，已中止加载货道数据');
        return;
    }
    
    try {
        localLoading.value = true;
        console.log('开始加载货道数据，machineId:', props.machineId);
        
        // 调用我们已经确认的、唯一的、正确的API
        const response = await machineApi.queryAisleList(props.machineId);
        console.log('API响应数据:', response);
        
        // 【关键】根据“API契约”进行严谨的、确定性的数据解析
        if (response && response.code === 0 && Array.isArray(response.data)) {
            // 只有当 code 为 0 且 data 是一个数组时，才认为是有效数据
            aisleList.value = response.data;
            console.log('货道数据加载完成，数量:', aisleList.value.length);
            if (aisleList.value.length === 0) {
                console.warn('注意：API成功返回，但货道列表为空数组，请与后端确认该机器下是否有数据。');
            }
        } else {
            // 如果 code 不为 0，或者 data 不存在/不是数组，都视为异常情况
            aisleList.value = [];
            console.error('API返回的数据格式不符合预期或操作失败:', response);
        }
        
    } catch (error) {
        aisleList.value = []; // 网络层面的错误
        console.error('请求货道数据时发生网络错误:', error);
    } finally {
        localLoading.value = false;
    }
};


watch(
    () => props.machineId,
    (newMachineId, oldMachineId) => {
        if (newMachineId) {
            loadAisles();
            console.log('货道列表加载开始');
        }
    },
    { immediate: true } // 3. immediate: true 确保组件首次加载时也会执行，可以替代 onMounted
);


// 编辑货道
const handleEdit = (record) => {
    currentRecord.value = { ...record };
    modalVisible.value = true;
};

// 表单提交成功回调
const handleSuccess = () => {
    modalVisible.value = false;
    loadAisles();
};


</script>