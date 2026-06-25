<template>
  <v-container class="fill-height">
    <v-row justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="text-center pa-8">
          <v-card-text>
            <div class="text-h1 font-weight-bold text-primary mb-4" style="opacity: 0.3;">
              404
            </div>
            <h2 class="text-h4 font-weight-bold mb-2">页面未找到</h2>
            <p class="text-body-1 text-medium-emphasis mb-6">
              您访问的页面不存在或已被移除
            </p>
            <v-btn color="primary" size="large" to="/">
              <v-icon start>mdi-home</v-icon>
              返回首页
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
