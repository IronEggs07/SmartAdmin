<!--
  * 机器组列表
-->
<template>
  <!---------- 查询表单form begin ----------->
  <a-form class="smart-query-form">
    <a-row class="smart-query-form-row" v-privilege="'group:query'">
      <a-form-item label="组名称" class="smart-query-form-item">
        <a-input style="width: 200px" v-model:value="queryForm.groupName" placeholder="请输入组名称" @pressEnter="onSearch" />
      </a-form-item>

      <a-form-item label="负责人" class="smart-query-form-item">
        <!-- <a-input-search style="width: 200px" v-model:value="queryForm.managerName" placeholder="请选择负责人" readOnly
          @search="showManagerSelect">
          <template #enterButton>
            <a-button>选择</a-button>
          </template>
        </a-input-search> -->
        <a-input type="text" placeholder="请输入负责人" />
      </a-form-item>

      <a-form-item class="smart-query-form-item">
        <a-button-group>
          <a-button type="primary" @click="onSearch" v-privilege="'group:query'">
            <template #icon>
              <SearchOutlined />
            </template>
            查询
          </a-button>
          <a-button @click="resetQuery" v-privilege="'group:query'">
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
        <a-button @click="addGroup" type="primary" v-privilege="'group:add'">
          <template #icon>
            <PlusOutlined />
          </template>
          新建
        </a-button>

        <a-button @click="confirmBatchDelete" danger :disabled="selectedRowKeyList.length === 0"
          v-privilege="'group:batchDelete'">
          <template #icon>
            <DeleteOutlined />
          </template>
          批量删除
        </a-button>
        <!-- <a-button @click="showImportModal" type="primary" v-privilege="'group:import'">
          <template #icon>
            <ImportOutlined />
          </template>
          导入
        </a-button>

        <a-button @click="onExportGroup" type="primary" v-privilege="'group:export'">
          <template #icon>
            <ExportOutlined />
          </template>
          导出
        </a-button> -->
      </div>
    </a-row>
    <!---------- 表格操作行 end ----------->

    <a-table size="small" :dataSource="tableData" :columns="columns" rowKey="groupId" :scroll="{ x: 1000, y: yHeight }"
      bordered :pagination="false" :loading="tableLoading" :row-selection="{
        selectedRowKeys: selectedRowKeyList,
        onChange: onSelectChange
      }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'action'">
          <div class="smart-table-operate">
            <a-button @click="editGroup(record)" type="link" v-privilege="'group:update'">编辑</a-button>
            <a-button @click="deleteGroup(record)" danger type="link" v-privilege="'group:delete'">删除</a-button>
          </div>
        </template>
      </template>
    </a-table>

    <div class="smart-query-table-page">
      <a-pagination showSizeChanger showQuickJumper show-less-items :pageSizeOptions="PAGE_SIZE_OPTIONS"
        :defaultPageSize="queryForm.pageSize" v-model:current="queryForm.pageNum" v-model:pageSize="queryForm.pageSize"
        :total="total" @change="queryData" :show-total="(total) => `共${total}条`" />
    </div>

    <!-- 表单弹窗 -->
    <GroupFormModal ref="formModal" @reloadList="queryData" />

    <!-- 导入弹窗 -->
    <a-modal v-model:open="importModalVisible" title="导入机器组数据" :confirm-loading="importLoading" @ok="handleImport"
      @cancel="handleCancelImport" okText="导入" cancelText="取消">
      <div style="text-align: center; margin-bottom: 20px;">
        <a-button type="primary" @click="downloadTemplate">
          <template #icon>
            <DownloadOutlined />
          </template>
          下载导入模板
        </a-button>
      </div>
      <a-upload-dragger v-model:fileList="fileList" name="file" :multiple="false" :before-upload="beforeUpload"
        :showUploadList="true" accept=".xls,.xlsx">
        <p class="ant-upload-drag-icon">
          <InboxOutlined style="font-size: 48px; color: #1890ff;" />
        </p>
        <p class="ant-upload-text">点击或拖拽文件到此处上传</p>
        <p class="ant-upload-hint">支持 .xls 或 .xlsx 格式文件</p>
      </a-upload-dragger>
    </a-modal>

    <!-- 负责人选择弹窗 -->
    <!-- <UserSelectModal v-if="managerSelectVisible" :visible="managerSelectVisible" @ok="handleManagerSelect"
      @cancel="managerSelectVisible = false" /> -->
  </a-card>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { SmartLoading } from '/@/components/framework/smart-loading';
import { machineGroupApi } from '/@/api/business/vending/group-api';
import GroupFormModal from './components/group-form-modal.vue';
// import UserSelectModal from './components/user-select-modal.vue';
import { PAGE_SIZE_OPTIONS } from '/@/constants/common-const';
import { GROUP_STATUS_ENUM } from '/@/constants/business/vending/group-const';
import { ImportOutlined, ExportOutlined, DownloadOutlined, InboxOutlined } from '@ant-design/icons-vue';
import { smartSentry } from '/@/lib/smart-sentry';
import { SearchOutlined, ReloadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue';

// 表格列配置
const columns = [
  {
    title: '组ID',
    dataIndex: 'groupId',
    width: 80,
  },
  {
    title: '组名称',
    dataIndex: 'groupName',
    width: 150,
  },
  {
    title: '负责人ID',
    dataIndex: 'managerId',
    width: 100,
  },
  // {
  //   title: '关联机器数',
  //   dataIndex: 'machineCount',
  //   width: 100,
  // },
  {
    title: '备注',
    dataIndex: 'remark',
    ellipsis: true,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 150,
  },
  {
    title: '更新时间',
    dataIndex: 'updateTime',
    width: 150,
  },
  {
    title: '操作',
    dataIndex: 'action',
    width: 120,
    fixed: 'right',
  },
];

// 查询表单
const queryFormState = {
  pageNum: 1,
  pageSize: 10,
  groupName: '',
  managerId: undefined,
  sortItemList: [],
};
const queryForm = reactive({ ...queryFormState });

// 表格数据
const tableData = ref([]);
const total = ref(0);
const tableLoading = ref(false);
const selectedRowKeyList = ref([]);

// 弹窗相关
const formModal = ref();
const managerSelectVisible = ref(false); // 选择管理员弹窗

// 导入/导出状态
const importModalVisible = ref(false);
const fileList = ref([]);
const importLoading = ref(false);

// 查询数据
async function queryData() {
  tableLoading.value = true;
  try {
    const params = { ...queryForm };
    // 移除空值参数
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined) {
        delete params[key];
      }
    });

    const result = await machineGroupApi.queryMachineGroupList(params);
    tableData.value = result.data.list || [];
    total.value = result.data.total || 0;
  } catch (error) {
    console.error('查询机器组列表失败:', error);
    message.error('查询失败');
  } finally {
    tableLoading.value = false;
    console.log(queryForm);
  }
}

// 搜索
function onSearch() {
  queryForm.pageNum = 1;
  queryData();
}

// 重置查询
function resetQuery() {
  const pageSize = queryForm.pageSize;
  Object.assign(queryForm, { ...queryFormState });
  queryForm.pageSize = pageSize;
  queryData();
}

// 添加机器组
function addGroup() {
  formModal.value.showDrawer();
  console.log('zhengzaitianjia');
}

// 编辑机器组
function editGroup(record) {
  formModal.value.showDrawer(record);
}

// 删除机器组
function deleteGroup(record) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除【${record.groupName}】吗？`,
    okText: '删除',
    okType: 'danger',
    onOk: async () => {
      try {
        SmartLoading.show();
        await machineGroupApi.deleteMachineGroup(record.groupId);
        message.success('删除成功');
        queryData();
      } catch (error) {
        console.error('删除失败:', error);
        message.error('删除失败');
      } finally {
        SmartLoading.hide();
      }
    },
  });
}

// 批量删除
function confirmBatchDelete() {
  if (selectedRowKeyList.value.length === 0) {
    message.warning('请选择要删除的项');
    return;
  }

  Modal.confirm({
    title: '批量删除',
    content: `确定要删除选中的 ${selectedRowKeyList.value.length} 条记录吗？`,
    okText: '删除',
    okType: 'danger',
    onOk: batchDelete,
  });
}

async function batchDelete() {
  try {
    SmartLoading.show();
    await machineGroupApi.batchDelete(selectedRowKeyList.value);
    message.success('批量删除成功');
    selectedRowKeyList.value = [];
    queryData();
  } catch (error) {
    console.error('批量删除失败:', error);
    message.error('批量删除失败');
  } finally {
    SmartLoading.hide();
  }
}

// 选择行变化
function onSelectChange(selectedRowKeys) {
  selectedRowKeyList.value = selectedRowKeys;
}

// 显示导入弹窗
function showImportModal() {
  importModalVisible.value = true;
  fileList.value = [];
}

// 取消导入
function handleCancelImport() {
  importModalVisible.value = false;
  fileList.value = [];
}

// 下载导入模板
async function downloadTemplate() {
  try {
    await machineGroupApi.downloadGroupTemplate();
    message.success('模板下载成功');
  } catch (e) {
    smartSentry.captureError(e);
    message.error('模板下载失败');
  }
}

// 处理文件上传
function beforeUpload(file) {
  const isExcel = file.type === 'application/vnd.ms-excel' ||
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (!isExcel) {
    message.error('只能上传 Excel 文件!');
    return false;
  }
  fileList.value = [file];
  return false; // 阻止自动上传
}

// 执行导入
async function handleImport() {
  if (fileList.value.length === 0) {
    message.warning('请先选择要导入的文件');
    return;
  }

  const formData = new FormData();
  formData.append('file', fileList.value[0]);

  importLoading.value = true;
  try {
    await machineGroupApi.importMachineGroup(formData);
    message.success('导入成功');
    importModalVisible.value = false;
    fileList.value = [];
    queryData(); // 刷新列表
  } catch (e) {
    smartSentry.captureError(e);
    message.error(e.response?.data?.msg || '导入失败');
  } finally {
    importLoading.value = false;
  }
}

// 导出数据
async function onExportGroup() {
  try {
    await machineGroupApi.exportMachineGroup();
    message.success('导出成功');
  } catch (e) {
    smartSentry.captureError(e);
    message.error('导出失败');
  }
}

// 显示负责人选择弹窗
// function showManagerSelect() {
//   managerSelectVisible.value = true;
// }

// 处理选择负责人
// function handleManagerSelect(user) {
//   if (user) {
//     queryForm.managerId = user.userId;
//     queryForm.managerName = user.userName;
//   } else {
//     queryForm.managerId = undefined;
//     queryForm.managerName = '';
//   }
//   managerSelectVisible.value = false;
// }

// 动态表格高度
const yHeight = ref(0);
onMounted(() => {
  resetGetHeight();
  queryData();
});

function resetGetHeight() {
  setTimeout(() => {
    const doc = document.querySelector('.ant-form');
    const btn = document.querySelector('.smart-table-btn-block');
    const tableCell = document.querySelector('.ant-table-cell');
    const page = document.querySelector('.smart-query-table-page');
    const box = document.querySelector('.admin-content');

    if (doc && btn && tableCell && page && box) {
      const dueHeight = doc.offsetHeight + 10 + 24 + btn.offsetHeight + 15 + tableCell.offsetHeight + page.offsetHeight + 20;
      yHeight.value = box.offsetHeight - dueHeight;
    }
  }, 100);
}

</script>

<style scoped></style>