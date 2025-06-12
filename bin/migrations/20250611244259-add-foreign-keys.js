'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Pocket.owner_user_id → User.id
    await queryInterface.addConstraint('Pockets', {
      fields: ['owner_user_id'],
      type: 'foreign key',
      name: 'fk_pocket_owner_user',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // 2. PocketMember.user_id → User.id
    await queryInterface.addConstraint('PocketMembers', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_pocketmember_user',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // 3. PocketMember.pocket_id → Pocket.id
    await queryInterface.addConstraint('PocketMembers', {
      fields: ['pocket_id'],
      type: 'foreign key',
      name: 'fk_pocketmember_pocket',
      references: {
        table: 'Pockets',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // 4. Transaction.pocket_id → Pocket.id
    await queryInterface.addConstraint('Transactions', {
      fields: ['pocket_id'],
      type: 'foreign key',
      name: 'fk_transaction_pocket',
      references: {
        table: 'Pockets',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // 5. Transaction.initiator_user_id → User.id
    await queryInterface.addConstraint('Transactions', {
      fields: ['initiator_user_id'],
      type: 'foreign key',
      name: 'fk_transaction_initiator_user',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // 6. TransactionApproval.transaction_id → Transaction.id
    await queryInterface.addConstraint('TransactionApprovals', {
      fields: ['transaction_id'],
      type: 'foreign key',
      name: 'fk_transactionapproval_transaction',
      references: {
        table: 'Transactions',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // 7. TransactionApproval.approver_user_id → User.id
    await queryInterface.addConstraint('TransactionApprovals', {
      fields: ['approver_user_id'],
      type: 'foreign key',
      name: 'fk_transactionapproval_approver_user',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // 8. Notification.user_id → User.id
    await queryInterface.addConstraint('Notifications', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_notification_user',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // 9. MockSavingsAccounts.user_id → User.id
    await queryInterface.addConstraint('MockSavingsAccounts', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_mock_saving_account_user',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // 10. Friendships.user_id_1 → User.id
    await queryInterface.addConstraint('Friendships', {
      fields: ['user_id_1'],
      type: 'foreign key',
      name: 'fk_Friendships_user_1',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // 11. Friendships.user_id_2 → User.id
    await queryInterface.addConstraint('Friendships', {
      fields: ['user_id_2'],
      type: 'foreign key',
      name: 'fk_Friendships_user_2',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // 12. AutoBudgetings.user_id → User.id
    await queryInterface.addConstraint('AutoBudgetings', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_AutoBudgetings_user',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // 13. AutoBudgetings.pocket_id → Pocket.id
    await queryInterface.addConstraint('AutoBudgetings', {
      fields: ['pocket_id'],
      type: 'foreign key',
      name: 'fk_AutoBudgetings_pocket',
      references: {
        table: 'Pockets',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Add Indexes untuk performance
    await queryInterface.addIndex('Pockets', ['owner_user_id'], {
      name: 'idx_pockets_owner_user_id'
    });
    
    await queryInterface.addIndex('PocketMembers', ['user_id'], {
      name: 'idx_pocketmembers_user_id'
    });
    
    await queryInterface.addIndex('PocketMembers', ['pocket_id'], {
      name: 'idx_pocketmembers_pocket_id'
    });
    
    await queryInterface.addIndex('PocketMembers', ['user_id', 'pocket_id'], {
      name: 'idx_pocketmembers_user_pocket',
      unique: true
    });
    
    await queryInterface.addIndex('Transactions', ['pocket_id'], {
      name: 'idx_transactions_pocket_id'
    });
    
    await queryInterface.addIndex('Transactions', ['initiator_user_id'], {
      name: 'idx_transactions_initiator_user_id'
    });
    
    await queryInterface.addIndex('TransactionApprovals', ['transaction_id'], {
      name: 'idx_transactionapprovals_transaction_id'
    });
    
    await queryInterface.addIndex('TransactionApprovals', ['approver_user_id'], {
      name: 'idx_transactionapprovals_approver_user_id'
    });
    
    await queryInterface.addIndex('Notifications', ['user_id'], {
      name: 'idx_notifications_user_id'
    });
    
    await queryInterface.addIndex('MockSavingsAccounts', ['user_id'], {
      name: 'idx_MockSavingsAccounts_user_id'
    });
    
    await queryInterface.addIndex('Friendships', ['user_id_1'], {
      name: 'idx_Friendships_user_id_1'
    });
    
    await queryInterface.addIndex('Friendships', ['user_id_2'], {
      name: 'idx_Friendships_user_id_2'
    });
    
    await queryInterface.addIndex('Friendships', ['user_id_1', 'user_id_2'], {
      name: 'idx_Friendships_user_pair',
      unique: true
    });
    
    await queryInterface.addIndex('AutoBudgetings', ['user_id'], {
      name: 'idx_AutoBudgetings_user_id'
    });
    
    await queryInterface.addIndex('AutoBudgetings', ['pocket_id'], {
      name: 'idx_AutoBudgetings_pocket_id'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove all constraints in reverse order
    const constraints = [
      { table: 'AutoBudgetings', name: 'fk_AutoBudgetings_pocket' },
      { table: 'AutoBudgetings', name: 'fk_AutoBudgetings_user' },
      { table: 'Friendships', name: 'fk_Friendships_user_2' },
      { table: 'Friendships', name: 'fk_Friendships_user_1' },
      { table: 'MockSavingsAccounts', name: 'fk_mock_saving_account_user' },
      { table: 'Notifications', name: 'fk_notification_user' },
      { table: 'TransactionApprovals', name: 'fk_transactionapproval_approver_user' },
      { table: 'TransactionApprovals', name: 'fk_transactionapproval_transaction' },
      { table: 'Transactions', name: 'fk_transaction_initiator_user' },
      { table: 'Transactions', name: 'fk_transaction_pocket' },
      { table: 'PocketMembers', name: 'fk_pocketmember_pocket' },
      { table: 'PocketMembers', name: 'fk_pocketmember_user' },
      { table: 'Pockets', name: 'fk_pocket_owner_user' }
    ];

    // Remove constraints
    for (const constraint of constraints) {
      try {
        await queryInterface.removeConstraint(constraint.table, constraint.name);
      } catch (error) {
        console.log(`Warning: Could not remove constraint ${constraint.name} from ${constraint.table}`);
      }
    }

    // Remove indexes
    const indexes = [
      { table: 'AutoBudgetings', name: 'idx_AutoBudgetings_pocket_id' },
      { table: 'AutoBudgetings', name: 'idx_AutoBudgetings_user_id' },
      { table: 'Friendships', name: 'idx_Friendships_user_pair' },
      { table: 'Friendships', name: 'idx_Friendships_user_id_2' },
      { table: 'Friendships', name: 'idx_Friendships_user_id_1' },
      { table: 'MockSavingsAccounts', name: 'idx_MockSavingsAccounts_user_id' },
      { table: 'Notifications', name: 'idx_notifications_user_id' },
      { table: 'TransactionApprovals', name: 'idx_transactionapprovals_approver_user_id' },
      { table: 'TransactionApprovals', name: 'idx_transactionapprovals_transaction_id' },
      { table: 'Transactions', name: 'idx_transactions_initiator_user_id' },
      { table: 'Transactions', name: 'idx_transactions_pocket_id' },
      { table: 'PocketMembers', name: 'idx_pocketmembers_user_pocket' },
      { table: 'PocketMembers', name: 'idx_pocketmembers_pocket_id' },
      { table: 'PocketMembers', name: 'idx_pocketmembers_user_id' },
      { table: 'Pockets', name: 'idx_pockets_owner_user_id' }
    ];

    // Remove indexes
    for (const index of indexes) {
      try {
        await queryInterface.removeIndex(index.table, index.name);
      } catch (error) {
        console.log(`Warning: Could not remove index ${index.name} from ${index.table}`);
      }
    }
  }
};