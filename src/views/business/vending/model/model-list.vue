<!--
  * 机器型号列表
-->
<template>
    <!---------- 查询表单form begin ----------->
    <a-form class="smart-query-form">
      <a-row class="smart-query-form-row" v-privilege="'model:query'">
        <a-form-item label="型号名称" class="smart-query-form-item">
          <a-input style="width: 200px" v-model:value="queryForm.modelName" placeholder="请输入型号名称" @pressEnter="onSearch" />
        </a-form-item>

        <a-form-item class="smart-query-form-item">
          <a-button-group>
            <a-button type="primary" @click="onSearch" v-privilege="'model:query'">
              <template #icon>
                <SearchOutlined />
              </template>
              查询
            </a-button>
            <a-button @click="resetQuery" v-privilege="'model:query'">
              <template #icon>
                <ReloadOutlined />
              </template>
              重置
            </a-button>
          </a-button-group>
        </a-form-item>
      </a-row>
    </a-form>
    <!---------- 查询表单form end ----------->

    <a-card size="small" :bordered="false" :hoverable="true">
      <!---------- 表格操作行 begin ----------->
      <a-row class="smart-table-btn-block">
        <div class="smart-table-operate-block">
          <a-button @click="addModel()" type="primary" v-privilege="'model:add'">
            <template #icon>
              <PlusOutlined />
            </template>
            新建
          </a-button>

          <a-button @click="confirmBatchDelete" danger :disabled="selectedRowKeyList.length === 0" v-privilege="'model:batchDelete'">
            <template #icon>
              <DeleteOutlined />
            </template>
            批量删除
          </a-button>
        </div>
      </a-row>
      <!---------- 表格操作行 end ----------->
      <a-table
        size="small"
        :dataSource="tableData"
        :columns="columns"
        rowKey="modelId"
        :scroll="{ x: 1000, y: yHeight }"
        bordered
        :pagination="false"
        :loading="tableLoading"
        :showSorterTooltip="false"
        :row-selection="{ selectedRowKeys: selectedRowKeyList, onChange: onSelectChange }"
        @change="onChange"
        @resizeColumn="handleResizeColumn"
      >

        <template #bodyCell="{ record, column }">
          <template v-if="column.dataIndex === 'action'">
            <div class="smart-table-operate">
              <a-button @click="addModel(record)" type="link" v-privilege="'model:update'">编辑</a-button>
              <a-button @click="deleteModel(record)" danger type="link" v-privilege="'model:delete'">删除</a-button>
            </div>
          </template>
        </template>
      </a-table>

      <div class="smart-query-table-page">
        <a-pagination
          showSizeChanger
          showQuickJumper
          show-less-items
          :pageSizeOptions="PAGE_SIZE_OPTIONS"
          :defaultPageSize="queryForm.pageSize"
          v-model:current="queryForm.pageNum"
          v-model:pageSize="queryForm.pageSize"
          :total="total"
          @change="queryData"
          :show-total="(total) => `共${total}条`"
        />
      </div>

      <!-- 表单抽屉 -->
      <ModelFormModal ref="formModal" @reloadList="queryData" />
    </a-card>
  </template>

  <script setup>
    import { machineModelApi } from '/@/api/business/vending/model-api.js';
    import ModelFormModal from './components/model-form-modal.vue';
    import { onMounted, reactive, ref } from 'vue';
    import { message, Modal } from 'ant-design-vue';
    import { SmartLoading } from '/@/components/framework/smart-loading';
    import { PAGE_SIZE_OPTIONS } from '/@/constants/common-const';
    import { smartSentry } from '/@/lib/smart-sentry';
    import _ from 'lodash';


    // ---------------------------- 表格列 ----------------------------

    const columns = ref([
      {
        title: '型号ID',
        dataIndex: 'modelId',
        width: 100,
        resizable: true,
        align: 'center',
      },
      {
        title: '型号名称',
        dataIndex: 'modelName',
        resizable: true,
        filterOptions: {
          type: 'input',
          key: 'modelName',
        },
        width: 200,
      },
      {
        title: '货道数量',
        dataIndex: 'aisleCount',
        resizable: true,
        width: 120,
        align: 'center',
      },
      {
        title: '单次最大限购数量',
        dataIndex: 'maxPurchase',
        resizable: true,
        width: 150,
        align: 'center',
      },
      {
        title: '备注',
        dataIndex: 'remark',
        resizable: true,
        width: 200,
      },
      {
        title: '创建时间',
        dataIndex: 'createTime',
        resizable: true,
        width: 180,
        sorter: true,
      },
      {
        title: '更新时间',
        dataIndex: 'updateTime',
        resizable: true,
        width: 180,
        sorter: true,
      },
      {
        title: '操作',
        dataIndex: 'action',
        fixed: 'right',
        width: 150,
      },
    ]);

    // ---------------------------- 查询数据表单和方法 ----------------------------

    const queryForm = reactive({
      modelName: undefined, // 型号名称
      pageNum: 1,
      pageSize: 10,
      sortItemList: [], // 添加排序项
    });
    // 表格加载loading
    const tableLoading = ref(false);
    // 表格数据
    const tableData = ref([]);
    // 总数
    const total = ref(0);

    function handleResizeColumn(w, col) {
      columns.value.forEach((item) => {
        if (item.dataIndex === col.dataIndex) {
          item.width = Math.floor(w);
          item.dragAndDropFlag = true;
        }
      });
    }
    // 重置查询条件
    function resetQuery() {
      queryForm.modelName = undefined;
      queryForm.pageNum = 1;
      onSearch();
    }

    // 搜索
    function onSearch() {
      queryForm.pageNum = 1;
      queryData();
    }

    // 查询数据
    async function queryData() {
      tableLoading.value = true;
      try {
        let queryResult = await machineModelApi.queryMachineModelList(queryForm);
        tableData.value = queryResult.data.list;
        total.value = queryResult.data.total;
      } catch (e) {
        smartSentry.captureError(e);
      } finally {
        tableLoading.value = false;
      }
    }

    onMounted(queryData);

    // ---------------------------- 添加/修改 ----------------------------

    const formModal = ref();

    // 添加/编辑型号
    function addModel(record) {
      formModal.value.showDrawer(record);
    }

    // ---------------------------- 删除 ----------------------------

    // 单个删除
    async function deleteModel(record) {
      Modal.confirm({
        title: '提示',
        content: `确定要删除型号【${record.modelName}】吗？`,
        okText: '删除',
        okType: 'danger',
        onOk: async () => {
          SmartLoading.show();
          try {
            await machineModelApi.deleteMachineModel(record.modelId);
            message.success('删除成功');
            queryData();
          } catch (e) {
            smartSentry.captureError(e);
          } finally {
            SmartLoading.hide();
          }
        },
        cancelText: '取消',
      });
    }

    // ---------------------------- 批量删除 ----------------------------

    const selectedRowKeyList = ref([]);

    function onSelectChange(selectedRowKeys) {
      selectedRowKeyList.value = selectedRowKeys;
    }

    // 确认批量删除
    function confirmBatchDelete() {
      if (selectedRowKeyList.value.length === 0) {
        message.warning('请选择要删除的型号');
        return;
      }

      Modal.confirm({
        title: '提示',
        content: `确定要删除选中的 ${selectedRowKeyList.value.length} 个型号吗？`,
        okText: '删除',
        okType: 'danger',
        onOk: batchDelete,
        cancelText: '取消',
      });
    }
    // 执行批量删除
    async function batchDelete() {
      try {
        SmartLoading.show();
        await machineModelApi.batchDelete(selectedRowKeyList.value);
        message.success('删除成功');
        selectedRowKeyList.value = [];
        queryData();
      } catch (e) {
        smartSentry.captureError(e);
      } finally {
        SmartLoading.hide();
      }
    }

    // ---------------------------- 表格排序 ----------------------------

    function onChange(pagination, filters, sorter, { action }) {
      if (action === 'sort') {
        const { order, field } = sorter;
        let column = camelToUnderscore(field);
        let findIndex = queryForm.sortItemList.findIndex((e) => e.column === column);
        if (findIndex !== -1) {
          queryForm.sortItemList.splice(findIndex, 1);
        }
        if (order) {
          let isAsc = order !== 'ascend';
          queryForm.sortItemList.push({
            column,
            isAsc,
          });
        }
        queryData();
      }
    }
  
    function camelToUnderscore(str) {
      return str.replace(/([A-Z])/g, '_$1').toLowerCase();
    }
  
    // ---------------------------- 动态高度 ----------------------------
    const yHeight = ref(0);
    onMounted(() => {
      resetGetHeight();
    });
    function resetGetHeight() {
      let doc = document.querySelector('.ant-form');
      let btn = document.querySelector('.smart-table-btn-block');
      let tableCell = document.querySelector('.ant-table-cell');
      let page = document.querySelector('.smart-query-table-page');
      let box = document.querySelector('.admin-content');
      setTimeout(() => {
        if (!doc || !btn || !tableCell || !page || !box) {
          return;
        }
        let dueHeight = doc.offsetHeight + 10 + 24 + btn.offsetHeight + 15 + tableCell.offsetHeight + page.offsetHeight + 20;
        yHeight.value = box.offsetHeight - dueHeight;
      }, 100);
    }
    window.addEventListener(
      'resize',
      _.throttle(() => {
        resetGetHeight();
      }, 1000)
    );
  </script>