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
//   import { useMachineStore } from '@/stores/machine';
// import { storeToRefs } from 'pinia';

const props = defineProps({
    machineId: {
        type: Number,
        required: true
    }
});

const columns = ref([
    {
        title: '货道编号',
        dataIndex: 'aisleCode',
        width: 100,
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
        width: 80,
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
    if (!props.machineId)
        return;
    try {
        localLoading.value = true; // 开始加载
        const { data } = await machineApi.queryAisleList(props.machineId);
        aisleList.value = data.list || [];
    } catch (error) {
        console.error('加载货道数据失败:', error);
    } finally {
        localLoading.value = false; // 结束加载
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