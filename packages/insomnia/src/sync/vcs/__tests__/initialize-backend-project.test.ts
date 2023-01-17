import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { globalBeforeEach } from '../../../__jest__/before-each';
import * as models from '../../../models';
import MemoryDriver from '../../store/drivers/memory-driver';
import { initializeLocalBackendProjectAndMarkForSync, pushSnapshotOnInitialize } from '../initialize-backend-project';
import { VCS } from '../vcs';

describe('initialize-backend-project', () => {
  beforeEach(globalBeforeEach);

  describe('initializeLocalBackendProjectAndMarkForSync()', () => {
    it('should do nothing if not request collection', async () => {
      // Arrange
      const workspace = await models.workspace.create({ scope: 'design' });
      const vcs = new VCS(new MemoryDriver());
      const switchAndCreateBackendProjectIfNotExistSpy = jest.spyOn(vcs, 'switchAndCreateBackendProjectIfNotExist');

      // Act
      await initializeLocalBackendProjectAndMarkForSync({ workspace, vcs });

      // Assert
      expect(switchAndCreateBackendProjectIfNotExistSpy).not.toHaveBeenCalled();
      // const workspaceMeta = await models.workspaceMeta.getByParentId(workspace._id);
      // expect(workspaceMeta?.pushSnapshotOnInitialize).toBe(false);
      switchAndCreateBackendProjectIfNotExistSpy.mockClear();
    });
  });

  describe('pushSnapshotOnInitialize()', () => {
    const vcs = new VCS(new MemoryDriver());

    const pushSpy = jest.spyOn(vcs, 'push');

    beforeEach(() => {
      jest.resetAllMocks();
    });

    afterAll(() => {
      pushSpy.mockClear();
    });

    it('should not push if no active project', async () => {
      const project = await models.project.create({ remoteId: null });
      const workspace = await models.workspace.create({ parentId: project._id });
      const workspaceMeta = await models.workspaceMeta.create({ parentId: workspace._id });
      vcs.clearBackendProject();

      await pushSnapshotOnInitialize({ vcs, project, workspace, workspaceMeta });

      expect(pushSpy).not.toHaveBeenCalled();
      await expect(models.workspaceMeta.getByParentId(workspace._id)).resolves.toStrictEqual(workspaceMeta);
    });

    it('should not push snapshot if not remote project', async () => {
      const project = await models.project.create({ remoteId: null });
      const workspace = await models.workspace.create({ parentId: project._id });
      const workspaceMeta = await models.workspaceMeta.create({ parentId: workspace._id });
      vcs.switchAndCreateBackendProjectIfNotExist(workspace._id, workspace.name);

      await pushSnapshotOnInitialize({ vcs, project, workspace, workspaceMeta });

      expect(pushSpy).not.toHaveBeenCalled();
      await expect(models.workspaceMeta.getByParentId(workspace._id)).resolves.toStrictEqual(workspaceMeta);
    });

    it('should not push snapshot if workspace not in project', async () => {
      const project = await models.project.create({ remoteId: 'abc' });
      const anotherProject = await models.project.create({ remoteId: 'def' });
      const workspace = await models.workspace.create({ parentId: anotherProject._id });
      const workspaceMeta = await models.workspaceMeta.create({ parentId: workspace._id });
      vcs.switchAndCreateBackendProjectIfNotExist(workspace._id, workspace.name);

      await pushSnapshotOnInitialize({ vcs, project, workspace, workspaceMeta });

      expect(pushSpy).not.toHaveBeenCalled();
      // await expect(models.workspaceMeta.getByParentId(workspace._id)).resolves.toStrictEqual(workspaceMeta);
    });

    it('should not push snapshot if not marked for push', async () => {
      const project = await models.project.create({ remoteId: 'abc' });
      const workspace = await models.workspace.create({ parentId: project._id });
      const workspaceMeta = await models.workspaceMeta.create({ parentId: workspace._id, pushSnapshotOnInitialize: false });
      vcs.switchAndCreateBackendProjectIfNotExist(workspace._id, workspace.name);

      await pushSnapshotOnInitialize({ vcs, project, workspace, workspaceMeta });

      expect(pushSpy).not.toHaveBeenCalled();
      await expect(models.workspaceMeta.getByParentId(workspace._id)).resolves.toStrictEqual(workspaceMeta);
    });

    it('should push snapshot if conditions are met', async () => {
      const project = await models.project.create({ remoteId: 'abc' });
      const workspace = await models.workspace.create({ parentId: project._id });
      const workspaceMeta = await models.workspaceMeta.create({ parentId: workspace._id, pushSnapshotOnInitialize: true });
      vcs.switchAndCreateBackendProjectIfNotExist(workspace._id, workspace.name);

      await pushSnapshotOnInitialize({ vcs, project, workspace, workspaceMeta });

      expect(pushSpy).toHaveBeenCalledWith(project.remoteId);
      const updatedMeta = await models.workspaceMeta.getByParentId(workspace._id);
      expect(updatedMeta?.pushSnapshotOnInitialize).toBe(false);
    });
  });
});
