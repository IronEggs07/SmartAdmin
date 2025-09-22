<template>
    <a-drawer :title="form.groupId ? '编辑分组' : '新增分组'" :width="500" :open="visible"
        :body-style="{ paddingBottom: '80px' }" @close="onClose">
        <a-form ref="formRef" :model="form" :rules="rules" :label-col="{ span: 5 }">
            <a-form-item label="分组名称" name="groupName">
                <a-input v-model:value="form.groupName" placeholder="请输入分组名称" allow-clear />
            </a-form-item>

    

            <a-form-item label="状态" name="status">
                <a-radio-group v-model:value="form.status" @change="handleStatusChange">
                    <a-radio v-for="status in statusOptions" :key="status.value" :value="status.value">
                        {{ status.desc }}
                    </a-radio>
                </a-radio-group>
            </a-form-item>

            <a-form-item label="负责人" name="managerId">
                <a-input-search 
                    v-model:value="form.managerName" 
                    placeholder="请选择负责人" 
                    readOnly
                    @search="showManagerSelect"
                    :disabled="!form.status"
                >
                    <template #enterButton>
                        <a-button :disabled="!form.status">选择</a-button>
                    </template>
                </a-input-search>
                <div v-if="form.status" class="manager-hint">
                    {{ form.status === GROUP_STATUS_ENUM.ADMIN.value ? '请选择5位管理员ID' : '请选择7位补货员ID' }}
                </div>
            </a-form-item>

            <a-form-item label="备注" name="remark">
                <a-textarea v-model:value="form.remark" placeholder="请输入备注信息" :rows="4" :maxlength="200" show-count
                    allow-clear />
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
            <a-button type="primary" @click="onSubmit">提交</a-button>
        </div>
    </a-drawer>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, h } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { SmartLoading } from '/@/components/framework/smart-loading';
import { machineGroupApi } from '/@/api/business/vending/group-api';
import { GROUP_STATUS_ENUM } from '/@/constants/business/vending/group-const';
import { smartSentry } from '/@/lib/smart-sentry';
import _ from 'lodash';

// 定义emit事件，用于通知父组件刷新列表
const emit = defineEmits(['reloadList']);

// 表单的ref
const formRef = ref();

// 状态选项
const statusOptions = Object.values(GROUP_STATUS_ENUM);

// 加载状态
const loading = ref(false);

// 控制抽屉显示/隐藏
const visible = ref(false);

// 默认表单数据
const formDefault = {
    groupId: undefined,
    groupName: '',
    managerId: undefined,
    managerName: '',
    status: GROUP_STATUS_ENUM.ADMIN.value,
    remark: '',
};

// 响应式的表单数据
const form = reactive({ ...formDefault });

// 表单验证规则
const rules = {
    groupName: [
        { required: true, message: '请输入分组名称', trigger: 'blur' },
        { max: 50, message: '长度不能超过50个字符', trigger: 'blur' }
    ],
    groupCode: [
        { required: true, message: '请输入分组编码', trigger: 'blur' },
        { max: 50, message: '长度不能超过50个字符', trigger: 'blur' }
    ],
    managerId: [
        { required: true, message: '请选择负责人', trigger: 'change' }
    ],
    status: [
        { required: true, message: '请选择状态', trigger: 'change' }
    ],
    remark: [
        { max: 200, message: '长度不能超过200个字符', trigger: 'blur' }
    ]
};

// 显示抽屉
function showDrawer(rowData) {
    // 重置表单为默认值
    Object.assign(form, formDefault);
    // 如果传入了行数据（编辑模式），则用行数据覆盖表单
    if (rowData && !_.isEmpty(rowData)) {
        Object.assign(form, rowData);
    }
    // 打开抽屉
    visible.value = true;
    // 使用nextTick确保DOM更新后清除之前的校验信息
    nextTick(() => {
        formRef.value?.clearValidate();
    });
}

// 关闭抽屉
function onClose() {
    visible.value = false;
}

// 提交表单
function onSubmit() {
    formRef.value
        .validate()
        .then(async () => {
            loading.value = true;
            try {
                if (form.groupId) {
                    await machineGroupApi.updateMachineGroup(form.groupId, form);
                    message.success('更新成功');
                } else {
                    await machineGroupApi.addMachineGroup(form);
                    message.success('添加成功');
                }
                onClose();
                emit('reloadList');
            } catch (error) {
                console.error('操作失败:', error);
                smartSentry.captureError(error);
                message.error(error.response?.data?.message || '操作失败，请重试');
            } finally {
                loading.value = false;
            }
        })
        .catch(() => {
            message.error('表单验证失败，请检查输入');
        });
}

// 状态变更处理
function handleStatusChange() {
    // 清空之前选择的负责人
    form.managerId = undefined;
    form.managerName = '';
}

// 显示负责人选择弹窗
function showManagerSelect() {
    if (!form.status) {
        message.warning('请先选择状态');
        return;
    }
    
    Modal.confirm({
        title: '选择' + (form.status === GROUP_STATUS_ENUM.ADMIN.value ? '管理员' : '补货员'),
        width: 600,
        content: h('div', [
            h('div', { style: 'margin-bottom: 16px' }, '请选择' + (form.status === GROUP_STATUS_ENUM.ADMIN.value ? '管理员' : '补货员') + 'ID'),
            h('a-input', {
                placeholder: '请输入' + (form.status === GROUP_STATUS_ENUM.ADMIN.value ? '5位管理员' : '7位补货员') + 'ID',
                style: 'width: 200px; margin-right: 8px',
                onChange: (e) => {
                    const value = e.target.value;
                    // 根据状态验证ID格式
                    if (form.status === GROUP_STATUS_ENUM.ADMIN.value) {
                        if (value && !/^\d{5}$/.test(value)) {
                            return message.warning('管理员ID必须为5位数字');
                        }
                    } else {
                        if (value && !/^\d{7}$/.test(value)) {
                            return message.warning('补货员ID必须为7位数字');
                        }
                    }
                    form.managerId = value;
                },
                value: form.managerId
            }),
            h('a-button', {
                type: 'primary',
                onClick: () => {
                    if (!form.managerId) {
                        return message.warning('请输入ID');
                    }
                    // 模拟获取负责人名称，实际项目中应该调用API获取
                    form.managerName = form.status === GROUP_STATUS_ENUM.ADMIN.value 
                        ? `管理员(${form.managerId})` 
                        : `补货员(${form.managerId})`;
                    Modal.destroyAll();
                }
            }, '确认')
        ]),
        onOk: () => {
            if (!form.managerId) {
                message.warning('请选择负责人');
                return Promise.reject();
            }
        },
        okButtonProps: { style: 'display: none' },
        cancelButtonProps: { style: 'display: none' }
    });
}

// 使用defineExpose暴露方法，让父组件可以通过ref调用
defineExpose({
    showDrawer
});
</script>

<style scoped>
.manager-hint {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.45);
    margin-top: 4px;
}
</style>