<!--
  * 目录 表单 弹窗
  * 
  * @Author:    1024创新实验室-主任：卓大 
  * @Date:      2022-08-21 19:52:43 
  * @Wechat:    zhuda1024 
  * @Email:     lab1024@163.com 
  * @Copyright  1024创新实验室 （ https://1024lab.net ），Since 2012 
-->
<template>
  <a-modal :open="visible" :title="form.categoryId ? '编辑' : '添加'" ok-text="确认" cancel-text="取消" @ok="onSubmit" @cancel="onClose">
    <a-form ref="formRef" :model="form" :rules="rules" :label-col="{ span: 5 }" :wrapper-col="{ span: 12 }">
      <a-form-item label="分类名称" name="categoryName">
        <a-input v-model:value="form.categoryName" placeholder="请输入分类名称" />
      </a-form-item>
      <a-form-item label="分类图标" name="icon">
        <a-upload
          v-model:fileList="fileList"
          list-type="picture-card"
          class="avatar-uploader"
          :show-upload-list="false"
          :before-upload="beforeUpload"
          :custom-request="handleUpload"
          accept="image/png, image/jpeg, image/jpg"
        >
          <img v-if="form.icon" :src="form.icon" alt="分类图标" style="width: 100%;" />
          <div v-else>
            <plus-outlined />
            <div class="ant-upload-text">上传图标</div>
          </div>
        </a-upload>
      </a-form-item>
    </a-form>
  </a-modal>
</template>
<script setup>
  import { ref, reactive, nextTick } from 'vue';
  import { message, Upload } from 'ant-design-vue';
  import { PlusOutlined } from '@ant-design/icons-vue';
  import { SmartLoading } from '/@/components/framework/smart-loading';
  import _ from 'lodash';
  import { categoryApi } from '/@/api/business/category/category-api';
  import { fileApi } from '/@/api/support/file-api';
  import { smartSentry } from '/@/lib/smart-sentry';
  // emit
  const emit = defineEmits(['reloadList']);

  //  组件
  const formRef = ref();

  // ------------------------------ 显示 、隐藏 ------------------------------

  // 是否展示抽屉
  const visible = ref(false);

  function showModal(categoryType, parentId, rowData) {
    Object.assign(form, formDefault);
    form.categoryType = categoryType;
    form.parentId = parentId;
    if (rowData && !_.isEmpty(rowData)) {
      Object.assign(form, rowData);
    }
    visible.value = true;
    nextTick(() => {
      // 解决弹窗错误信息显示,没有可忽略
      const domArr = document.getElementsByClassName('ant-modal');
      if (domArr && domArr.length > 0) {
        Array.from(domArr).forEach((item) => {
          if (item.childNodes && item.childNodes.length > 0) {
            Array.from(item.childNodes).forEach((child) => {
              if (child.setAttribute) {
                child.setAttribute('aria-hidden', 'false');
              }
            });
          }
        });
      }
    });
  }

  function onClose() {
    Object.assign(form, formDefault);
    visible.value = false;
  }

  // ------------------------------ 表单 ------------------------------

  const formDefault = {
    categoryId: undefined,
    categoryName: '',
    categoryType: 1,
    parentId: undefined,
    disabledFlag: false,
    icon: undefined, // 添加图标字段
  };
  let form = reactive({ ...formDefault });
  const rules = {
    categoryName: [{ required: true, message: '请输入分类名称' }],
  };

  // 文件上传相关
  const fileList = ref([]);
  
  // 上传前验证
  const beforeUpload = (file) => {
    const isImage = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isImage) {
      message.error('只能上传 JPG/PNG 格式的图片!');
      return Upload.LIST_IGNORE;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB!');
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  // 处理上传
  const handleUpload = async ({ file, onSuccess, onError }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // 上传文件到服务器
      const response = await fileApi.uploadFile(formData, 'category');
      if (response.data) {
        // 保存文件URL到表单数据
        form.icon = response.data;
        onSuccess();
      } else {
        throw new Error('上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      onError('上传失败');
      message.error('上传失败: ' + (error.message || '未知错误'));
    }
  };

  function onSubmit() {
    formRef.value
      .validate()
      .then(async () => {
        SmartLoading.show();
        try {
          if (form.categoryId) {
            await categoryApi.updateCategory(form);
          } else {
            await categoryApi.addCategory(form);
          }
          message.success(`${form.categoryId ? '修改' : '添加'}成功`);
          emit('reloadList', form.parentId);
          onClose();
        } catch (error) {
          smartSentry.captureError(error);
        } finally {
          SmartLoading.hide();
        }
      })
      .catch((error) => {
        console.log('error', error);
        message.error('参数验证错误，请仔细填写表单数据!');
      });
  }

  defineExpose({
    showModal,
  });
</script>
