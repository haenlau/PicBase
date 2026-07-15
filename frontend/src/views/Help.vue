<template>
  <v-container fluid class="pa-4 pa-md-6">
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold">配置说明</h1>
      <p class="text-body-1 text-medium-emphasis mt-1">了解如何配置存储渠道和数据库</p>
    </div>

    <v-row>
      <!-- R2 存储桶 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon color="orange" class="mr-2">mdi-cloud</v-icon>
            Cloudflare R2 存储桶
            <v-spacer />
            <v-chip size="small" color="success" variant="tonal">必须</v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <p class="text-body-2 mb-4">
              R2 是 Cloudflare 提供的对象存储服务，用于存储上传的图片文件。
            </p>
            
            <v-alert type="info" variant="tonal" class="mb-4">
              <strong>作用：</strong>存储上传的图片文件
            </v-alert>

            <v-stepper alt-labels :items="['步骤1', '步骤2', '步骤3', '步骤4']">
              <template #item.1>
                <v-card flat>
                  <v-card-text>
                    <p class="font-weight-bold mb-2">创建 R2 存储桶</p>
                    <ol class="pl-4">
                      <li>进入 <a href="https://dash.cloudflare.com" target="_blank">Cloudflare Dashboard</a></li>
                      <li>左侧菜单选择 <strong>R2</strong></li>
                      <li>点击 <strong>创建存储桶</strong></li>
                      <li>输入存储桶名称（如 <code>picbase</code>）</li>
                      <li>选择地区，点击创建</li>
                    </ol>
                  </v-card-text>
                </v-card>
              </template>

              <template #item.2>
                <v-card flat>
                  <v-card-text>
                    <p class="font-weight-bold mb-2">绑定到 Pages 项目</p>
                    <ol class="pl-4">
                      <li>进入你的 <strong>Pages 项目</strong></li>
                      <li>点击 <strong>设置</strong> → <strong>函数</strong></li>
                      <li>找到 <strong>R2 存储桶</strong> 部分</li>
                      <li>点击 <strong>添加绑定</strong></li>
                    </ol>
                  </v-card-text>
                </v-card>
              </template>

              <template #item.3>
                <v-card flat>
                  <v-card-text>
                    <p class="font-weight-bold mb-2">配置绑定变量</p>
                    <v-table density="compact" class="mb-2">
                      <tbody>
                        <tr>
                          <td class="font-weight-bold">变量名称</td>
                          <td><code>img_r2</code></td>
                        </tr>
                        <tr>
                          <td class="font-weight-bold">R2 存储桶</td>
                          <td>选择你刚创建的存储桶</td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-card-text>
                </v-card>
              </template>

              <template #item.4>
                <v-card flat>
                  <v-card-text>
                    <p class="font-weight-bold mb-2">保存并重新部署</p>
                    <ol class="pl-4">
                      <li>点击 <strong>保存</strong></li>
                      <li>进入 <strong>部署</strong> 页面</li>
                      <li>点击 <strong>重新部署</strong></li>
                    </ol>
                  </v-card-text>
                </v-card>
              </template>
            </v-stepper>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- D1 数据库 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon color="blue" class="mr-2">mdi-database</v-icon>
            D1 数据库
            <v-spacer />
            <v-chip size="small" color="success" variant="tonal">必须</v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <p class="text-body-2 mb-4">
              D1 是 Cloudflare 提供的 SQLite 数据库，用于存储文件元数据、配置信息等。
            </p>
            
            <v-alert type="info" variant="tonal" class="mb-4">
              <strong>作用：</strong>存储文件信息、系统配置、用户会话
            </v-alert>

            <v-stepper alt-labels :items="['步骤1', '步骤2', '步骤3']">
              <template #item.1>
                <v-card flat>
                  <v-card-text>
                    <p class="font-weight-bold mb-2">创建 D1 数据库</p>
                    <ol class="pl-4">
                      <li>进入 <a href="https://dash.cloudflare.com" target="_blank">Cloudflare Dashboard</a></li>
                      <li>左侧菜单选择 <strong>Workers 和 Pages</strong></li>
                      <li>点击 <strong>D1</strong> → <strong>创建数据库</strong></li>
                      <li>输入数据库名称（如 <code>picbase-db</code>）</li>
                    </ol>
                  </v-card-text>
                </v-card>
              </template>

              <template #item.2>
                <v-card flat>
                  <v-card-text>
                    <p class="font-weight-bold mb-2">绑定到 Pages 项目</p>
                    <ol class="pl-4">
                      <li>进入你的 <strong>Pages 项目</strong></li>
                      <li>点击 <strong>设置</strong> → <strong>函数</strong></li>
                      <li>找到 <strong>D1 数据库绑定</strong> 部分</li>
                      <li>点击 <strong>添加绑定</strong></li>
                    </ol>
                  </v-card-text>
                </v-card>
              </template>

              <template #item.3>
                <v-card flat>
                  <v-card-text>
                    <p class="font-weight-bold mb-2">配置绑定变量</p>
                    <v-table density="compact" class="mb-2">
                      <tbody>
                        <tr>
                          <td class="font-weight-bold">变量名称</td>
                          <td><code>img_d1</code></td>
                        </tr>
                        <tr>
                          <td class="font-weight-bold">D1 数据库</td>
                          <td>选择你刚创建的数据库</td>
                        </tr>
                      </tbody>
                    </v-table>
                    <p class="text-caption text-medium-emphasis mt-2">
                      保存后重新部署即可生效
                    </p>
                  </v-card-text>
                </v-card>
              </template>
            </v-stepper>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- KV 存储 (可选) -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon color="purple" class="mr-2">mdi-key-variant</v-icon>
            KV 存储
            <v-spacer />
            <v-chip size="small" color="grey" variant="tonal">可选</v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <p class="text-body-2 mb-4">
              KV 是 Cloudflare 提供的键值存储，可以替代 D1 存储元数据。
            </p>
            
            <v-alert type="warning" variant="tonal" class="mb-4">
              <strong>说明：</strong>如果已配置 D1，则不需要 KV。两者选其一即可。
            </v-alert>

            <v-expansion-panels>
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon class="mr-2">mdi-information</v-icon>
                  KV 与 D1 的区别
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-table density="compact">
                    <thead>
                      <tr>
                        <th>特性</th>
                        <th>KV</th>
                        <th>D1</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>数据结构</td>
                        <td>键值对</td>
                        <td>关系型数据库</td>
                      </tr>
                      <tr>
                        <td>查询能力</td>
                        <td>简单</td>
                        <td>SQL 查询</td>
                      </tr>
                      <tr>
                        <td>适用场景</td>
                        <td>简单配置</td>
                        <td>复杂数据</td>
                      </tr>
                      <tr>
                        <td>推荐程度</td>
                        <td>一般</td>
                        <td>推荐</td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon class="mr-2">mdi-cog</v-icon>
                  如何配置 KV
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <ol class="pl-4">
                    <li>进入 Cloudflare Dashboard</li>
                    <li>左侧菜单选择 <strong>Workers 和 Pages</strong></li>
                    <li>点击 <strong>KV</strong> → <strong>创建命名空间</strong></li>
                    <li>输入名称（如 <code>picbase-kv</code>）</li>
                    <li>进入 Pages 项目 → 设置 → 函数</li>
                    <li>找到 <strong>KV 命名空间绑定</strong></li>
                    <li>添加绑定：<code>img_url</code></li>
                    <li>保存并重新部署</li>
                  </ol>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- API 上传 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon color="teal" class="mr-2">mdi-send-variant</v-icon>
            API 传图
            <v-spacer />
            <v-chip size="small" color="info" variant="tonal">可选</v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <p class="text-body-2 mb-4">
              在“安全设置”中创建拥有 <code>upload</code> 权限的 API Token 后，可以通过脚本直接上传图片。
            </p>

            <v-alert type="warning" variant="tonal" class="mb-4">
              Token 明文只会在创建后显示一次，请立即复制保存。
            </v-alert>

            <v-table density="compact" class="mb-4">
              <tbody>
                <tr>
                  <td class="font-weight-bold">请求地址</td>
                  <td><code>POST /upload</code></td>
                </tr>
                <tr>
                  <td class="font-weight-bold">认证头</td>
                  <td><code>Authorization: Bearer imgbed_xxx</code></td>
                </tr>
                <tr>
                  <td class="font-weight-bold">文件字段</td>
                  <td><code>file</code></td>
                </tr>
                <tr>
                  <td class="font-weight-bold">上传目录</td>
                  <td><code>uploadFolder</code> 可选；不传或传 <code>/</code> 表示根目录，传 <code>album/2026</code> 表示子目录</td>
                </tr>
              </tbody>
            </v-table>

            <v-sheet class="api-code pa-3" rounded="sm">
              <pre><code>curl.exe -X POST "https://你的域名/upload?uploadFolder=/" -H "Authorization: Bearer imgbed_xxx" -F "file=@C:\path\image.png"
curl.exe -X POST "https://你的域名/upload?uploadFolder=album/2026" -H "Authorization: Bearer imgbed_xxx" -F "file=@C:\path\image.png"</code></pre>
            </v-sheet>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 配置总览 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon color="green" class="mr-2">mdi-clipboard-check</v-icon>
            配置清单
          </v-card-title>
          <v-divider />
          <v-card-text>
            <p class="text-body-2 mb-4">
              完成以下配置即可正常使用 PicBase：
            </p>

            <v-list>
              <v-list-item>
                <template #prepend>
                  <v-icon color="success">mdi-check-circle</v-icon>
                </template>
                <v-list-item-title>R2 存储桶</v-list-item-title>
                <v-list-item-subtitle>变量名：<code>img_r2</code></v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <template #prepend>
                  <v-icon color="success">mdi-check-circle</v-icon>
                </template>
                <v-list-item-title>D1 数据库（或 KV）</v-list-item-title>
                <v-list-item-subtitle>变量名：<code>img_d1</code> 或 <code>img_url</code></v-list-item-subtitle>
              </v-list-item>

              <v-divider class="my-2" />

              <v-list-item>
                <template #prepend>
                  <v-icon color="info">mdi-information</v-icon>
                </template>
                <v-list-item-title>可选配置</v-list-item-title>
                <v-list-item-subtitle>Telegram、S3、Discord 等其他渠道</v-list-item-subtitle>
              </v-list-item>
            </v-list>

            <v-alert type="success" variant="tonal" class="mt-4">
              <strong>提示：</strong>配置完成后，在"渠道配置"页面可以看到绑定状态。
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- 常见问题 -->
        <v-card class="mt-4">
          <v-card-title class="d-flex align-center">
            <v-icon color="amber" class="mr-2">mdi-frequently-asked-questions</v-icon>
            常见问题
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-expansion-panels variant="accordion">
              <v-expansion-panel>
                <v-expansion-panel-title>上传失败怎么办？</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <ol class="pl-4">
                    <li>检查 R2 是否已绑定</li>
                    <li>检查 D1 或 KV 是否已绑定</li>
                    <li>检查渠道配置是否正确</li>
                    <li>查看浏览器控制台错误信息</li>
                  </ol>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel>
                <v-expansion-panel-title>图片无法访问？</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <ol class="pl-4">
                    <li>确认 R2 绑定正确</li>
                    <li>检查文件是否上传成功</li>
                    <li>尝试重新部署项目</li>
                  </ol>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel>
                <v-expansion-panel-title>忘记管理员密码？</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <p>在 Cloudflare Dashboard 中删除 D1 数据库中的 <code>manage@sysConfig@security</code> 记录，然后重新登录。</p>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
</script>

<style scoped>
.v-stepper {
  box-shadow: none !important;
}

ol {
  padding-left: 20px;
}

ol li {
  margin-bottom: 4px;
}

code {
  background: rgba(var(--v-theme-primary), 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.875em;
}

.api-code {
  background: rgba(var(--v-theme-surface-variant), 0.35);
}

.api-code pre {
  margin: 0;
  overflow-x: auto;
  white-space: pre;
}
</style>
