<template>
    <a-drawer :title="title" :width="500" :visible="visible" :body-style="{ paddingBottom: '80px' }" @close="onClose"
        :maskClosable="false">
        <a-form :model="form" :rules="rules" ref="formRef" layout="vertical">
            <a-form-item label="组名称" name="group_name">
                <a-input v-model:value="form.group_name" placeholder="请输入组名称" :maxlength="100" show-word-limit />
            </a-form-item>

            <a-form-item label="负责人" name="manager_id">
                <!-- 使用下拉选择框选择负责人 -->
                <a-select v-model:value="form.manager_id" placeholder="请选择负责人" :options="userOptions"
                    :loading="userLoading" :filter-option="filterUserOption" show-search allow-clear />
                <!-- 
            注意：这里使用了简单的下拉选择框实现
            实际项目中可以替换为用户选择弹窗组件
            示例代码：
            <a-input-search
              v-model:value="form.manager_name"
              placeholder="请选择负责人"
              readOnly
              @search="showUserSelect"
            >
              <template #enterButton>
                <a-button>选择</a-button>
              </template>
</a-input-search>
-->
            </a-form-item>

            <a-form-item label="备注" name="remark">
                <a-textarea v-model:value="form.remark" placeholder="请输入备注信息" :rows="4" :maxlength="255"
                    show-word-limit />
            </a-form-item>

            <!-- 关联机器数量（只读显示） -->
            <a-form-item label="关联机器数" v-if="form.group_id">
                <a-input :value="form.machine_count || '0'" disabled />
            </a-form-item>

            <!-- 创建时间和更新时间（只读显示） -->
            <template v-if="form.group_id">
                <a-form-item label="创建时间">
                    <a-input :value="form.create_time" disabled />
                </a-form-item>
                <a-form-item label="更新时间">
                    <a-input :value="form.update_time" disabled />
                </a-form-item>
            </template>
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
import { ref, reactive, watch } from 'vue';
import { message } from 'ant-design-vue';
import { SmartLoading } from '/@/components/framework/smart-loading';
import { machineGroupApi } from '/@/api/business/vending/group-api';

const props = defineProps({
    // 是否显示弹窗
    visible: {
        type: Boolean,
        default: false,
    },
    // 编辑时的数据
    record: {
        type: Object,
        default: () => ({}),
    },
});

const emit = defineEmits(['update:visible', 'reloadList']);

// 表单引用
const formRef = ref();
// 加载状态
const loading = ref(false);
// 用户选项
const userOptions = ref([]);
// 用户加载状态
const userLoading = ref(false);

// 表单数据
const form = reactive({
    group_id: undefined,
    group_name: '',
    manager_id: undefined,
    manager_name: '',
    remark: '',
    machine_count: 0,
    create_time: '',
    update_time: '',
});

// 表单验证规则
const rules = {
    group_name: [
        { required: true, message: '请输入组名称', trigger: 'blur' },
        { max: 100, message: '组名称不能超过100个字符', trigger: 'blur' },
    ],
    manager_id: [
        { required: true, message: '请选择负责人', trigger: 'change' },
    ],
    remark: [
        { max: 255, message: '备注不能超过255个字符', trigger: 'blur' },
    ],
};

// 计算标题
const title = computed(() => {
    return form.group_id ? '编辑机器组' : '新增机器组';
});

// 监听可见性变化
watch(() => props.visible, (val) => {
    if (val) {
        // 重置表单
        formRef.value?.resetFields();

        // 加载用户列表
        loadUserList();

        // 如果是编辑模式，设置表单数据
        if (props.record?.group_id) {
            Object.assign(form, props.record);
        } else {
            // 新增模式，重置表单数据
            Object.assign(form, {
                group_id: undefined,
                group_name: '',
                manager_id: undefined,
                manager_name: '',
                remark: '',
                machine_count: 0,
                create_time: '',
                update_time: '',
            });
        }
    }
});

//   // 加载用户列表
//   async function loadUserList() {
//     try {
//       userLoading.value = true;
//       // 这里调用获取用户列表的API
//       // const result = await userApi.getUserList({ pageSize: 1000 });
//       // userOptions.value = result.data.list.map(user => ({
//       //   value: user.userId,
//       //   label: user.userName,
//       // }));

//       // 模拟数据
//       userOptions.value = [
//         { value: 1, label: '张三' },
//         { value: 2, label: '李四' },
//         { value: 3, label: '王五' },
//       ];
//     } catch (error) {
//       console.error('加载用户列表失败:', error);
//       message.error('加载用户列表失败');
//     } finally {
//       userLoading.value = false;
//     }
//   }

// 用户搜索过滤
// function filterUserOption(input, option) {
//     return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
// }

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

        if (params.group_id) {
            // 更新
            await machineGroupApi.updateMachineGroup(params);
            message.success('更新成功');
        } else {
            // 新增
            await machineGroupApi.addMachineGroup(params);
            message.success('添加成功');
        }

        onClose();
        emit('reloadList');
    } catch (error) {
        if (error.errorFields) {
            // 表单验证错误
            return;
        }
        console.error('保存失败:', error);
        message.error(error.message || '保存失败');
    } finally {
        loading.value = false;
        SmartLoading.hide();
    }
}

// 暴露方法给父组件调用
defineExpose({
    showDrawer(record) {
        if (record) {
            Object.assign(form, record);
        } else {
            formRef.value?.resetFields();
        }
        emit('update:visible', true);
    },
});
</script>

<style scoped>
:deep(.ant-form-item) {
    margin-bottom: 16px;
}
</style>