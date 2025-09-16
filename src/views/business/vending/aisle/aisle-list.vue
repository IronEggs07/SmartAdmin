<template>
  <a-drawer 
    :title="title" 
    :width="600" 
    :visible="visible" 
    :body-style="{ paddingBottom: '80px' }" 
    @close="onClose"
    :maskClosable="false"
  >
    <a-form 
      :model="form" 
      :rules="rules" 
      ref="formRef" 
      layout="vertical"
    >
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="货道ID" v-if="form.aisle_id">
            <a-input v-model:value="form.aisle_id" disabled />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="机器ID" name="machine_id">
            <a-input-number 
              v-model:value="form.machine_id" 
              placeholder="请输入机器ID" 
              style="width: 100%"
              :min="1"
            />
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="货道编号" name="aisle_code">
            <a-input 
              v-model:value="form.aisle_code" 
              placeholder="例如: A1, 02" 
              :maxlength="50" 
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="商品ID" name="goods_id">
            <a-input-number 
              v-model:value="form.goods_id" 
              placeholder="请输入商品ID" 
              style="width: 100%"
              :min="1"
            />
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="当前库存" name="stock">
            <a-input-number 
              v-model:value="form.stock" 
              placeholder="当前库存" 
              style="width: 100%"
              :min="0"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="货道容量" name="capacity">
            <a-input-number 
              v-model:value="form.capacity" 
              placeholder="货道容量" 
              style="width: 100%"
              :min="1"
            />
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item label="状态" name="status">
        <a-select v-model:value="form.status" placeholder="请选择状态">
          <a-select-option :value="0">禁用</a-select-option>
          <a-select-option :value="1">启用</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="备注" name="remark">
        <a-textarea 
          v-model:value="form.remark" 
          placeholder="请输入备注信息" 
          :rows="3" 
          :maxlength="255"
        />
      </a-form-item>

      <template v-if="form.aisle_id">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="创建时间">
              <a-input :value="form.create_time" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="更新时间">
              <a-input :value="form.update_time" disabled />
            </a-form-item>
          </a-col>
        </a-row>
      </template>
    </a-form>

    <div class="drawer-footer">
      <a-button @click="onClose">取消</a-button>
      <a-button type="primary" @click="handleSubmit" :loading="loading" style="margin-left: 8px">确定</a-button>
    </div>
  </a-drawer>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue';
import { message } from 'ant-design-vue';
import { SmartLoading } from '/@/components/framework/smart-loading';
import { aisleApi } from '/@/api/business/vending/aisle-api';


const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  record: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['update:visible', 'reloadList']);

const formRef = ref();
const loading = ref(false);

// 表单数据
const form = reactive({
  aisle_id: undefined,
  machine_id: undefined,
  aisle_code: '',
  goods_id: undefined,
  stock: 0,
  capacity: 1,
  status: 1,
  remark: '',
  create_time: '',
  update_time: '',
});

// 表单验证规则
const rules = {
  machine_id: [
    { required: true, message: '请输入机器ID', type: 'number' },
  ],
  aisle_code: [
    { required: true, message: '请输入货道编号' },
    { max: 50, message: '货道编号不能超过50个字符' },
  ],
  goods_id: [
    { required: true, message: '请输入商品ID', type: 'number' },
  ],
  stock: [
    { required: true, message: '请输入当前库存', type: 'number' },
    { type: 'number', min: 0, message: '库存不能为负数' },
  ],
  capacity: [
    { required: true, message: '请输入货道容量', type: 'number' },
    { type: 'number', min: 1, message: '容量必须大于0' },
  ],
  status: [
    { required: true, message: '请选择状态' },
  ],
  remark: [
    { max: 255, message: '备注不能超过255个字符' },
  ],
};

// 计算标题
const title = computed(() => {
  return form.aisle_id ? '编辑货道' : '新增货道';
});

// 监听可见性变化
watch(() => props.visible, (val) => {
  if (val) {
    formRef.value?.resetFields();
    if (props.record?.aisle_id) {
      Object.assign(form, props.record);
    } else {
      Object.assign(form, {
        aisle_id: undefined,
        machine_id: undefined,
        aisle_code: '',
        goods_id: undefined,
        stock: 0,
        capacity: 1,
        status: 1,
        remark: '',
        create_time: '',
        update_time: '',
      });
    }
  }
});

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

    const params = { ...form };
    
    if (params.aisle_id) {
      await aisleApi.updateAisle(params);
      message.success('更新成功');
    } else {
      await aisleApi.addAisle(params);
      message.success('添加成功');
    }
    
    emit('reloadList');
    onClose();
  } catch (error) {
    console.error('保存失败:', error);
    message.error(error.message || '保存失败');
  } finally {
    loading.value = false;
    SmartLoading.hide();
  }
}

// 暴露方法给父组件调用
defineExpose({
  showDrawer(record = {}) {
    Object.assign(form, record);
    emit('update:visible', true);
  }
});
</script>

<style scoped>
.drawer-footer {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 100%;
  border-top: 1px solid #e9e9e9;
  padding: 10px 16px;
  background: #fff;
  text-align: right;
  z-index: 1;
}

:deep(.ant-form-item) {
  margin-bottom: 16px;
}

:deep(.ant-form-item-label > label) {
  font-weight: 500;
}

:deep(.ant-input[disabled]) {
  color: rgba(0, 0, 0, 0.65);
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 1;
}
</style>