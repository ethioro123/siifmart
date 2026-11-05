import { useMutation, useQueryClient } from '@tanstack/react-query';
import { candidateCommandService, type CandidateDecision } from '../services/candidate-command.service';
import { employeesService } from '../services/employees.service';
type Command = { id:string;action:CandidateDecision;salary?:number;notes:string } | {id:string;action:'activate';department:string};
export function useCandidateCommand() {
 const cache=useQueryClient();
 return useMutation({mutationFn:async(input:Command)=>{
  if(input.action==='activate')return employeesService.getById(await candidateCommandService.activate(input.id,input.department));
  await candidateCommandService.decide(input.id,input.action,input.salary,input.notes);return null;
 },onSuccess:(_result,input)=>{cache.invalidateQueries({queryKey:['candidates']});if(input.action==='activate')cache.invalidateQueries({queryKey:['employees']});}});
}
