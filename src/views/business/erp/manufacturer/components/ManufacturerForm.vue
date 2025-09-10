<template>
    <a-modal
      :visible="visible"
      :title="formData.manufacturerId ? '编辑厂家' : '新增厂家'"
      @ok="handleSubmit"
      @cancel="handleCancel"
      :confirm-loading="confirmLoading"
      width="600px"
    >
      <a-form
        :model="formState"
        :rules="rules"
        ref="formRef"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="厂家名称" name="manufacturerName">
          <a-input
            v-model:value="formState.manufacturerName"
            placeholder="请输入厂家名称"
          />
        </a-form-item>
        <a-form-item label="联系人" name="contactPerson">
          <a-input
            v-model:value="formState.contactPerson"
            placeholder="请输入联系人"
          />
        </a-form-item>
        <a-form-item label="联系电话" name="contactPhone">
          <a-input
            v-model:value="formState.contactPhone"
            placeholder="请输入联系电话"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </template>
  
  <script setup>
  import { ref, reactive, watch } from 'vue';
  import { message } from 'ant-design-vue';
  import { addManufacturer, updateManufacturer } from '/@/api/business/erp/manufacturer-api';
  
  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    formData: {
      type: Object,
      default: () => ({})
    }
  });
  
  const emit = defineEmits(['update:visible', 'submit']);
  
  const formRef = ref();
  const confirmLoading = ref(false);
  
  const formState = reactive({
    manufacturerId: undefined,
    manufacturerName: undefined,
    contactPerson: undefined,
    contactPhone: undefined
  });
  
  const rules = {
    manufacturerName: [
      { required: true, message: '请输入厂家名称', trigger: 'blur' }
    ],
    contactPerson: [
      { required: true, message: '请输入联系人', trigger: 'blur' }
    ],
    contactPhone: [
      { required: true, message: '请输入联系电话', trigger: 'blur' }
    ]
  };
  
  // 监听visible变化
  watch(() => props.visible, (val) => {
    if (val) {
      // 重置表单
      if (formRef.value) {
        formRef.value.resetFields();
      }
      // 设置表单数据
      Object.assign(formState, props.formData);
    }
  });
  
  // 提交表单
  const handleSubmit = () => {
    formRef.value.validate().then(async () => {
      try {
        confirmLoading.value = true;
        if (formState.manufacturerId) {
          await updateManufacturer(formState);
          message.success('更新成功');
        } else {
          await addManufacturer(formState);
          message.success('添加成功');
        }
        emit('update:visible', false);
        emit('submit');
      } finally {
        confirmLoading.value = false;
      }
    });
  };
  
  // 取消
  const handleCancel = () => {
    emit('update:visible', false);
  };
  </script>