/**
 * ERP - 机器分组管理 APIs
 */
import { postRequest, getRequest, getDownload } from '/@/lib/axios';

/**
 * 机器分组管理API
 * 字段说明：
 * - groupCode: 分组编码 (varchar)
 * - groupName: 分组名称 (varchar)
 * - groupDesc: 分组描述 (varchar, 255长度)
 * - groupStatus: 分组状态 (int, 1:启用 2:禁用)
 * - extField1~extField4: 扩展字段 (int, 可选)
 * - createTime: 创建时间 (datetime)
 * - updateTime: 更新时间 (datetime)
 */
export const machineGroupApi = {
  /**
   * 分页查询机器分组列表
   * @param {Object} param 查询参数
   * @param {string} [param.groupName] 分组名称
   * @param {string} [param.groupCode] 分组编码
   * @param {number} [param.groupStatus] 分组状态
   * @param {number} [param.pageNum] 当前页码
   * @param {number} [param.pageSize] 每页条数
   * @returns {Promise} 返回分页查询结果
   */
  queryMachineGroupList: (param) => {
    return postRequest('/machineGroup/query', param);
  },

  /**
   * 添加机器分组
   * @param {Object} param 分组信息
   * @param {string} param.groupName 分组名称
   * @param {string} param.groupCode 分组编码
   * @param {string} [param.groupDesc] 分组描述
   * @param {number} [param.groupStatus=1] 分组状态，1:启用 2:禁用
   * @returns {Promise} 返回操作结果
   */
  addMachineGroup: (param) => {
    return postRequest('/machineGroup/add', param);
  },

  /**
   * 更新机器分组信息
   * @param {Object} param 分组信息
   * @param {number} param.groupId 分组ID
   * @param {string} [param.groupName] 分组名称
   * @param {string} [param.groupCode] 分组编码
   * @param {string} [param.groupDesc] 分组描述
   * @param {number} [param.groupStatus] 分组状态
   * @returns {Promise} 返回操作结果
   */
  updateMachineGroup: (param) => {
    return postRequest('/machineGroup/update', param);
  },

  /**
   * 删除机器分组
   * @param {number} groupId 分组ID
   * @returns {Promise} 返回操作结果
   */
  deleteMachineGroup: (groupId) => {
    return getRequest(`/machineGroup/delete/${groupId}`);
  },

  /**
   * 批量删除机器分组
   * @param {Array<number>} groupIdList 分组ID列表
   * @returns {Promise} 返回操作结果
   */
  batchDelete: (groupIdList) => {
    return postRequest('/machineGroup/batchDelete', groupIdList);
  },

  /**
   * 获取所有启用的机器分组（下拉选择用）
   * @returns {Promise} 返回分组列表
   */
  getAllEnabledGroups: () => {
    return getRequest('/machineGroup/listEnabled');
  },

  // /**
  //  * 导出机器分组数据
  //  * @returns {Promise} 返回文件下载流
  //  */
  // exportMachineGroup: () => {
  //   return getDownload('/machineGroup/export');
  // },

  // /**
  //  * 导入机器分组数据
  //  * @param {File} file 导入的文件
  //  * @returns {Promise} 返回导入结果
  //  */
  // importMachineGroup: (file) => {
  //   const formData = new FormData();
  //   formData.append('file', file);
  //   return postRequest('/machineGroup/import', formData, {
  //     headers: {
  //       'Content-Type': 'multipart/form-data'
  //     }
  //   });
  // }
};