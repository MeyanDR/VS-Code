import React, { useState } from 'react'
import { useAppState } from '../contexts/AppContext'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion'
import { Button } from './ui/button'
import { PlusIcon, DragHandleDots2Icon, CopyIcon, TrashIcon, Pencil1Icon, DotsVerticalIcon } from '@radix-ui/react-icons'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { SortableSection } from './SortableSection'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'

export default function SongStructure() {
  const { state, dispatch } = useAppState()
  const sections = Object.values(state.project.sections)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renamingSection, setRenamingSection] = useState(null)
  const [newSectionName, setNewSectionName] = useState('')
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  const handleDragEnd = (event) => {
    const { active, over } = event
    
    if (active.id !== over.id) {
      const oldIndex = sections.findIndex(s => s.id === active.id)
      const newIndex = sections.findIndex(s => s.id === over.id)
      
      dispatch({
        type: 'REORDER_SECTIONS',
        payload: { oldIndex, newIndex }
      })
    }
  }
  
  const handleSwitchSection = (sectionId) => {
    dispatch({ type: 'SET_CURRENT_SECTION', payload: sectionId })
  }
  
  const handleAddSection = () => {
    dispatch({ type: 'ADD_SECTION' })
  }
  
  const handleDuplicateSection = (sectionId) => {
    dispatch({ type: 'DUPLICATE_SECTION', payload: sectionId })
  }
  
  const handleDeleteSection = (sectionId) => {
    // Don't delete if it's the only section
    if (sections.length <= 1) {
      alert("Cannot delete the last section")
      return
    }
    dispatch({ type: 'DELETE_SECTION', payload: sectionId })
  }
  
  const handleRenameClick = (section) => {
    setRenamingSection(section)
    setNewSectionName(section.name)
    setRenameDialogOpen(true)
  }
  
  const handleRenameConfirm = () => {
    if (renamingSection && newSectionName.trim()) {
      dispatch({
        type: 'UPDATE_SECTION',
        payload: {
          sectionId: renamingSection.id,
          updates: { name: newSectionName.trim() }
        }
      })
    }
    setRenameDialogOpen(false)
    setRenamingSection(null)
    setNewSectionName('')
  }
  
  return (
    <>
      <Accordion type="single" collapsible defaultValue="structure" className="bg-daw-bg-secondary rounded-lg border border-daw-border">
        <AccordionItem value="structure" className="border-0">
          <AccordionTrigger className="px-3 py-2 hover:no-underline">
            <span className="text-sm font-semibold text-daw-text-secondary">Song Structure</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-3 pb-3">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sections.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1.5">
                    {sections.map(section => (
                      <SortableSection key={section.id} id={section.id}>
                        {({ dragHandleProps, isDragging }) => (
                          <div
                            className={`group relative px-2 py-1.5 rounded cursor-pointer transition-colors text-xs ${
                              state.project.currentSection === section.id
                                ? 'bg-daw-accent/20 border border-daw-accent text-daw-accent'
                                : 'bg-daw-button hover:bg-daw-button-hover text-daw-text-primary'
                            } ${isDragging ? 'shadow-lg' : ''}`}
                            onClick={() => handleSwitchSection(section.id)}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1">
                                <button
                                  {...dragHandleProps}
                                  onClick={(e) => e.stopPropagation()}
                                  className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                                >
                                  <DragHandleDots2Icon className="h-3 w-3" />
                                </button>
                                <span className="font-medium">{section.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-daw-text-dim">
                                  {section.grid.bars}b × {section.grid.beats}b
                                </span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      onClick={(e) => e.stopPropagation()}
                                      className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity"
                                    >
                                      <DotsVerticalIcon className="h-3 w-3" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDuplicateSection(section.id)
                                      }}
                                    >
                                      <CopyIcon className="mr-2 h-3 w-3" />
                                      Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleRenameClick(section)
                                      }}
                                    >
                                      <Pencil1Icon className="mr-2 h-3 w-3" />
                                      Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteSection(section.id)
                                      }}
                                      className="text-red-400 focus:text-red-400"
                                      disabled={sections.length <= 1}
                                    >
                                      <TrashIcon className="mr-2 h-3 w-3" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        )}
                      </SortableSection>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center border border-dashed border-daw-border hover:border-daw-accent"
                onClick={handleAddSection}
              >
                <PlusIcon className="h-3 w-3 mr-1" />
                Add Section
              </Button>
            </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
    
    <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Section</DialogTitle>
          <DialogDescription>
            Enter a new name for the section
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameConfirm()
                }
              }}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleRenameConfirm}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}