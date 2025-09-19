/*
 * 售货机管理 - Pinia Store
 *
 */

import { defineStore } from 'pinia';
import { ref, computed, reactive } from 'vue';
import { message } from 'ant-design-vue';
import { machineApi } from '/@/api/business/vending/machine-api';
import { machineAisleApi } from '/@/api/business/vending/aisle-api';

export const useMachineStore = defineStore('machine', () => {
  // 状态
  const machineList = ref([]);
  const aisleByMachine = ref([]);
  const loading = ref(false);
  const pagination = ref({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
  });

  // 货道数据缓存
  const aisleCache = new Map();

  // 它将存储 machineId -> aisleList 的映射
  const aislesByMachine = reactive({});

  // Getters
  const getMachineById = computed(() => (id) =>
    machineList.value.find(machine => machine.machineId === id)
  );

  // Actions
  // 获取机器列表
  const fetchMachineList = async (params = {}) => {
    try {
      loading.value = true;
      const { data } = await machineApi.getMachineList({
        pageNum: pagination.value.current,
        pageSize: pagination.value.pageSize,
        ...params
      });
      machineList.value = data.list || [];
      pagination.value.total = data.total || 0;
      return data;
    } catch (error) {
      console.error('获取机器列表失败:', error);
      message.error('获取机器列表失败');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 获取单个机器详情
  const fetchMachineDetail = async (machineId) => {
    try {
      const { data } = await machineApi.getMachineDetail(machineId);
      return data;
    } catch (error) {
      console.error('获取机器详情失败:', error);
      message.error('获取机器详情失败');
      throw error;
    }
  };

  // 获取机器的货道列表
  const fetchMachineAisles = async (machineId) => {
    // 如果缓存中已有数据，则不再请求 (注意：现在是检查 reactive 对象)
    if (aislesByMachine[machineId]) {
      return; // 数据已存在，直接结束
    }

    try {
      // 推荐为货道列表也设置一个独立的 loading 状态
      // loadingAisles.value = true; 
      const { data } = await machineAisleApi.getAislesByMachineId(machineId);

      // 核心改变：更新响应式状态，而不是返回数据
      aislesByMachine[machineId] = data || [];

    } catch (error) {
      console.error('获取货道列表失败:', error);
      message.error('获取货道列表失败');
      // 可以在这里设置一个空数组，防止页面因 undefined 报错
      aislesByMachine[machineId] = [];
    } finally {
      // loadingAisles.value = false;
    }
  };

  // 更新货道信息
  const updateAisle = async (aisleData) => {
    try {
      const { data } = await machineAisleApi.updateAisle(aisleData);

      // 核心改变：清除响应式状态中的缓存
      if (aislesByMachine[aisleData.machineId]) {
        // 通过 delete 操作触发响应式更新
        delete aislesByMachine[aisleData.machineId];
      }

      message.success('更新货道成功');
      return data;
    } catch (error) {
      // ... 错误处理 ...
    }
  };

  // 重置分页
  const resetPagination = () => {
    pagination.value = {
      current: 1,
      pageSize: 10,
      total: 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total) => `共 ${total} 条`,
    };
  };

  // 清空缓存
  const clearCache = () => {
    aisleCache.clear();
  };

  return {
    // State
    machineList,
    loading,
    pagination,

    aislesByMachine,
    // Getters
    getMachineById,

    // Actions
    fetchMachineList,
    fetchMachineDetail,
    fetchMachineAisles,
    updateAisle,
    resetPagination,
    clearCache
  };
});

// 在组件中使用示例：
// import { useMachineStore } from '/@/store/modules/business/vending/machine-store';
// const machineStore = useMachineStore();
// await machineStore.fetchMachineList();