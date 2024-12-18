import java.util.Arrays;

public class ls{
    public static void main(String[] args) {
        int nums[] = {3,4,1,2,6};
        int q[][] = {{0,4}};
        System.out.println(Arrays.toString(isArraySpecial(nums, q)));
    }
    public static boolean[] isArraySpecial(int[] nums, int[][] queries) {
        boolean res[] = new boolean[queries.length];
        for(int i=0; i<res.length; i++){
            res[i] = true;
        }
        int n = 0;
        for(int q[] : queries){
            int st = q[0];
            int end = q[1];
            for(int i=st; i<end; i++){
                if(nums[i] % 2 == nums[i+1] % 2){
                    res[n] = false;
                    System.out.println("Got");
                    break; 
                }
                else{
                    System.out.println("Np");
                }
            }
            n++;
        }
        return res;
    }
}