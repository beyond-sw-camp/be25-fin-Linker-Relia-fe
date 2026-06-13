<template>
  <ContractListContent
    page-title="보유 계약 목록"
    :show-organization-filter="false"
    :allow-contract-create-button="true"
  />
</template>

<script setup>
import ContractListContent from '../../components/contracts/ContractListContent.vue'
</script>
