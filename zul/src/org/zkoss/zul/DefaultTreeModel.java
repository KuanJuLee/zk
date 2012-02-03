/* DefaultTreeModel.java

	Purpose:
		
	Description:
		
	History:
		Wed Jan  5 17:37:01 TST 2011, Created by tomyeh

Copyright (C) 2011 Potix Corporation. All Rights Reserved.

*/
package org.zkoss.zul;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.zkoss.lang.Objects;
import org.zkoss.zul.DefaultTreeNode.TreeNodeChildrenList;
import org.zkoss.zul.event.TreeDataEvent;
import org.zkoss.zul.ext.TreeOpenableModel;
import org.zkoss.zul.ext.TreeSelectionModel;
import org.zkoss.zul.ext.Sortable;
import org.zkoss.zul.ext.Selectable;
import org.zkoss.zul.ext.Openable;

/**
 * A simple tree data model that uses {@link TreeNode} to represent a tree.
 * Thus the whole tree of data must be loaded into memory, and each node
 * must be represented by {@link TreeNode}.
 *
 * <p>If you want to implement a huge tree that only a visible part shall
 * be loaded, it is better to implement it by extending from
 * {@link AbstractTreeModel}.
 *
 * <p>{@link DefaultTreeModel} depends on {@link TreeNode} only.
 * It does not depend on {@link DefaultTreeNode}. However, {@link DefaultTreeNode}
 * depends on {@link DefaultTreeModel}.
 *
 * <p>For introduction, please refer to
 * <a href="http://books.zkoss.org/wiki/ZK_Developer's_Reference/MVC/Model/Tree_Model">ZK Developer's Reference: Tree Model</a>.
 *
 * @author tomyeh
 * @since 5.0.6
 */
public class DefaultTreeModel<E> extends AbstractTreeModel<TreeNode<E>>
implements Sortable<TreeNode<E>>, TreeSelectionModel, TreeOpenableModel,
Selectable<TreeNode<E>>, Openable<TreeNode<E>>, java.io.Serializable {

	private static final long serialVersionUID = 20110131094811L;
	private HashSet<TreeNode<E>> _opens = new HashSet<TreeNode<E>>();
	private HashSet<TreeNode<E>> _selection = new HashSet<TreeNode<E>>();

	private Comparator<TreeNode<E>> _sorting;

	private boolean _sortDir;
	
	private boolean _multiple;

	// Selectable//Selectable
	@Override
	public void setMultiple(boolean multiple) {
		if (_multiple != multiple) {
			_multiple = multiple;
			fireEvent(getRoot(), -1, -1, TreeDataEvent.MULTIPLE_CHANGED);

			if (!multiple && _selection.size() > 1) {
				final List<TreeNode<E>> sel = new ArrayList<TreeNode<E>>();
				sel.addAll(_selection);
				TreeNode<E> v = sel.remove(0);
				_selection.clear();
				_selection.add(v);

				for (final TreeNode<E> node: sel)
					fireSelectionChanged(node);
			}
		}
	}

	@Override
	public boolean isMultiple() {
		return _multiple;
	}


	/**
	 * Returns the selections set.
	 */
	public Set<TreeNode<E>> getSelection() {
		HashSet<TreeNode<E>> selected = new HashSet<TreeNode<E>>();
		int[][] paths = getSelectionPaths();
		if (paths != null)
			for (int i = 0; i < paths.length; i++)
				selected.add(getChild(paths[i]));
		return selected;
	}


	/** Creates a tree with the specified note as the root.
	 * @param root the root (cannot be null).
	 */
	public DefaultTreeModel(TreeNode<E> root) {
		super(root);

		TreeNode<E> parent = root.getParent();
		if (parent != null)
			parent.remove(root);
		root.setModel(this);
	}

	@Override
	public boolean isLeaf(TreeNode<E> node) {
		return node.isLeaf();
	}
	@Override
	public TreeNode<E> getChild(TreeNode<E> parent, int index) {
		return parent.getChildAt(index);
	}
	@Override
	public int getChildCount(TreeNode<E> parent) {
		return parent.getChildCount();
	}
	@Override
	public int getIndexOfChild(TreeNode<E> parent, TreeNode<E> child) {
		return parent.getIndex(child);
	}

	/**
	 * Returns the path from the child, where the path indicates the child is
	 * placed in the whole tree.
	 * @param child the node we are interested in
	 * @since 6.0.0
	 */
	@Override
	public int[] getPath(TreeNode<E> child) {
		final TreeNode<E> root = getRoot();
		List<Integer> p = new ArrayList<Integer>();
		while (root != child) {
			TreeNode<E> parent = child.getParent();
			if (parent != null) {
				for (int i = 0, j = parent.getChildCount(); i < j; i++) {
					if (parent.getChildAt(i) == child) {
						p.add(0, i);
						break;
					}
				}
				child = parent;
			}
		}
		final Integer[] objs = p.toArray(new Integer[p.size()]);
		final int[] path = new int[objs.length];
		for (int i = 0; i < objs.length; i++)
			path[i] = objs[i].intValue();
		return path;
	}
	
	// TreeOpenableModel
	@Override
	public void addOpenPath(int[] path) {
		if (path != null && path.length > 0) {
			int[][] paths = new int[1][path.length];
			paths[0] = path;
			addOpenPaths(paths);
		}
	}
	
	@Override
	public void addOpenPaths(int[][] paths) {
		int newPathLength = paths != null ? paths.length : 0;
		if (newPathLength > 0) {
			for (TreeNode<E> e : getNodesByPath(paths)) {
				if (!_opens.contains(e)) {
					_opens.add(e);
					fireOpenChanged(e);
				}
			}
		}
	}

	@Override
	public void removeOpenPath(int[] path) {
		if (path != null && path.length > 0) {
			int[][] paths = new int[1][path.length];
			paths[0] = path;
			removeOpenPaths(paths);
		}
	}

	@Override
	public void removeOpenPaths(int[][] paths) {
		int newPathLength = paths != null ? paths.length : 0;
		if (newPathLength > 0 && !_opens.isEmpty())
			for (TreeNode<E> e : getNodesByPath(paths))
				if (_opens.remove(e))
					fireOpenChanged(e);
	}

	@Override
	public boolean isPathOpened(int[] path) {
		if (path != null && !_opens.isEmpty()) {
			TreeNode<E> e = getChild(path);
			if (e != null)
				return _opens.contains(e);
		}
		return false;
	}

	@Override
	public int[] getOpenPath() {
		if (!_opens.isEmpty()) {
			return getPath(_opens.iterator().next());
		} else return null;
	}

	@Override
	public int[][] getOpenPaths() {
		if (!_opens.isEmpty()) {
			List<int[]> paths = new ArrayList<int[]>();
			for (TreeNode<E> e : _opens) {
				int[] path = getPath(e);
				if (path != null)
					paths.add(path);
			}
			return paths.toArray(new int[0][]);
		} else return null;
	}

	@Override
	public int getOpenCount() {
		return _opens.size();
	}

	@Override
	public boolean isOpenEmpty() {
		return _opens.isEmpty();
	}

	@Override
	public void clearOpen() {
		if (!_opens.isEmpty()) {
			for (TreeNode<E> e : new ArrayList<TreeNode<E>>(_opens)) {
				_opens.remove(e);
				fireOpenChanged(e);
			}
		}
	}

	@SuppressWarnings("unchecked")
	private List<TreeNode<E>> getNodesByPath(int[][] paths) {
		if (paths == null)
			return Collections.EMPTY_LIST;
		List<TreeNode<E>> list = new ArrayList<TreeNode<E>>();
		for (int[] path : paths) {
			TreeNode<E> node = getChild(path);
			if (node != null)
				list.add(node);
		}
		return list;
	}
	
	// TreeSelectionModel
	@Override
	public void addSelectionPath(int[] path) {
		if (path != null && path.length > 0) {
			int[][] paths = new int[1][path.length];
			paths[0] = path;
			addSelectionPaths(paths);
		}
	}

	@Override
	public void addSelectionPaths(int[][] paths) {
		int newPathLength = paths != null ? paths.length : 0;
		if (newPathLength > 0) {
			if (!isMultiple()) {
				List<TreeNode<E>> newSelection = getNodesByPath(paths);
				if (!newSelection.isEmpty()) {
					TreeNode<E> e = newSelection.get(0);
					if (!_selection.contains(e)) {
						_selection.clear();
						_selection.add(e);
						fireSelectionChanged(e);
					}
				}
			} else {
				for (TreeNode<E> e : getNodesByPath(paths)) {
					if (!_selection.contains(e)) {
						_selection.add(e);
						fireSelectionChanged(e);
					}
				}
			}
		}
	}

	@Override
	public boolean removeSelectionPath(int[] path) {
		if (path != null && path.length > 0) {
			int[][] paths = new int[1][path.length];
			paths[0] = path;
			return removeSelectionPaths(paths);
		}
		return false;
	}

	@Override
	public boolean removeSelectionPaths(int[][] paths) {
		boolean found = false;
		int newPathLength = paths != null ? paths.length : 0;
		if (newPathLength > 0 && !_selection.isEmpty()) {
			for (TreeNode<E> e : getNodesByPath(paths)) {
				if (_selection.remove(e)) {
					found = true;
					fireSelectionChanged(e);
				}
				if (!isMultiple())
					break;
			}
		}
		return found;
	}

	@Override
	public boolean isPathSelected(int[] path) {
		if (path != null && !_selection.isEmpty()) {
			TreeNode<E> e = getChild(path);
			if (e != null)
				return _selection.contains(e);
		}
		return false;
	}

	@Override
	public int[] getSelectionPath() {
		if (!_selection.isEmpty()) {
			return getPath(_selection.iterator().next());
		} else return null;
	}

	@Override
	public int[][] getSelectionPaths() {
		if (!_selection.isEmpty()) {
			List<int[]> paths = new ArrayList<int[]>();
			for (TreeNode<E> e : _selection) {
				int[] path = getPath(e);
				if (path != null)
					paths.add(path);
			}
			return paths.toArray(new int[0][]);
		} else return null;
	}

	@Override
	public int getSelectionCount() {
		return _selection.size();
	}

	@Override
	public boolean isSelectionEmpty() {
		return _selection.isEmpty();
	}

	@Override
	public void clearSelection() {
		if (!_selection.isEmpty()) {
			for (TreeNode<E> e : new ArrayList<TreeNode<E>>(_selection)) {
				_selection.remove(e);
				fireSelectionChanged(e);
			}
		}
	}
	
	// Clone
	@SuppressWarnings("unchecked")
	public Object clone() {
		DefaultTreeModel<E> clone = (DefaultTreeModel<E>)super.clone();
		clone._selection = new HashSet<TreeNode<E>>(_selection);
		clone._opens = new HashSet<TreeNode<E>>(_opens);
		return clone;
	}
	//-- Sortable --//
	/** Sorts the data.
	 *
	 * @param cmpr the comparator.
	 * @param ascending whether to sort in the ascending order.
	 * It is ignored since this implementation uses cmprt to compare.
	 */
	@Override
	public void sort(Comparator<TreeNode<E>> cmpr, final boolean ascending) {
		_sorting = cmpr;
		_sortDir = ascending;
		TreeNode<E> root = getRoot();
		if (root != null) {
			sort0(root, cmpr);
			fireStructureChangedEvent(root);
		}
	}
	
	@SuppressWarnings("unchecked")
	private void sort0(TreeNode<E> node, Comparator<TreeNode<E>> cmpr) {
		if (node.getChildren() == null) return;
		if (node instanceof DefaultTreeNode)
			((TreeNodeChildrenList)node.getChildren()).sort(cmpr);
		else
			Collections.sort(node.getChildren(), cmpr);
		for (TreeNode<E> child: node.getChildren())
			sort0(child, cmpr);
	}
	
	private void fireStructureChangedEvent(TreeNode<E> node) {
		if (node.getChildCount() == 0) return;
		fireEvent(node, 0, 0,TreeDataEvent.STRUCTURE_CHANGED);
	}

	//Selectable//
	@Override
	public void setSelection(Collection<? extends TreeNode<E>> selection) {
		clearSelection();
		for (final TreeNode<E> node: selection)
			addToSelection(node);
	}
	@Override
	public boolean isSelected(TreeNode<E> child) {
		final int[] path = getPath(child);
		if (path != null && path.length > 0)
			return isPathSelected(path);
		return false;
	}
	@Override
	public void addToSelection(TreeNode<E> child) {
		final int[] path = getPath(child);
		if (path != null && path.length > 0)
			addSelectionPath(path);
	}
	@SuppressWarnings("unchecked")
	@Override
	public boolean removeFromSelection(Object child) {
		if (child instanceof TreeNode) {
			final int[] path = getPath((TreeNode)child);
			if (path != null && path.length > 0)
				return removeSelectionPath(path);
		}
		return false;
	}

	//Openable//
	@Override
	public void setOpen(TreeNode<E> child, boolean open) {
		final int[] path = getPath(child);
		if (path != null && path.length > 0) {
			if (open)
				addOpenPath(path);
			else
				removeOpenPath(path);
		}
	}
	@SuppressWarnings("unchecked")
	@Override
	public boolean isOpen(Object child) {
		if (child instanceof TreeNode) {
			final int[] path = getPath((TreeNode)child);
			if (path != null && path.length > 0)
				return isPathOpened(path);
		}
		return false;
	}

	//For Backward Compatibility//
	/** @deprecated As of release 6.0.0, replaced with {@link #addToSelection}.
	 */
	@SuppressWarnings("unchecked")
	public void addSelection(Object obj) {
		if (obj instanceof TreeNode)
			addToSelection((TreeNode)obj);
	}
	/** @deprecated As of release 6.0.0, replaced with {@link #removeFromSelection}.
	 */
	public void removeSelection(Object obj) {
		removeFromSelection(obj);
	}

	public String getSortDirection(Comparator<TreeNode<E>> cmpr) {
		if (Objects.equals(_sorting, cmpr))
			return _sortDir ?
					"ascending" : "descending";
		return "natural";	
	}
}
